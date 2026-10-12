import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Consumer, DtlsParameters, Producer, RtpCapabilities, RtpParameters, WebRtcTransport } from 'mediasoup/types';
import { EventEmitter } from 'node:events';
import { KeyedSerialExecutor } from '../common/keyed-serial-executor';
import { MEDIA_CODECS, transportOptions } from './sfu.config';
import type { MediaPeer, MediaRoom, MediaTag, ProducerInfo, SfuNotification, TransportDirection } from './sfu.types';
import { WorkerManager } from './worker-manager.service';

/** Owns media resources only. Call authorization and Socket.IO belong to calls. */
@Injectable()
export class SfuService implements OnModuleDestroy {
  private readonly rooms = new Map<string, MediaRoom>();
  private readonly operations = new KeyedSerialExecutor();
  private readonly events = new EventEmitter();
  private stopping = false;

  constructor(private readonly workers: WorkerManager, private readonly config: ConfigService) {}

  onNotification(listener: (event: SfuNotification) => void): () => void {
    this.events.on('notification', listener);
    return () => { this.events.off('notification', listener); };
  }

  private notify(event: SfuNotification): void { this.events.emit('notification', event); }

  join(roomId: string, peerId: string) {
    return this.operations.run(roomId, async () => {
      if (this.stopping) throw new Error('SFU is shutting down');
      let room = this.rooms.get(roomId);
      if (!room) {
        const router = await this.workers.getWorker().createRouter({ mediaCodecs: MEDIA_CODECS });
        if (this.stopping) { router.close(); throw new Error('SFU is shutting down'); }
        room = { router, peers: new Map() };
        this.rooms.set(roomId, room);
        const ownedRoom = room;
        router.observer.on('close', () => {
          if (this.rooms.get(roomId) === ownedRoom) {
            this.rooms.delete(roomId);
            this.notify({ roomId, event: 'media_room_closed', data: {} });
          }
        });
      }
      if (!room.peers.has(peerId)) {
        room.peers.set(peerId, { transports: new Map(), producers: new Map(), consumers: new Map() });
      }
      return { rtpCapabilities: room.router.rtpCapabilities, existingProducers: this.producers(room, peerId) };
    });
  }

  listProducers(roomId: string, peerId: string): ProducerInfo[] {
    const { room } = this.context(roomId, peerId);
    return this.producers(room, peerId);
  }

  createTransport(roomId: string, peerId: string, direction: TransportDirection) {
    return this.operations.run(roomId, async () => {
      const { room, peer } = this.context(roomId, peerId);
      if (direction !== 'send' && direction !== 'recv') throw new Error('Invalid transport direction');
      const existing = [...peer.transports.values()].find((entry) => entry.direction === direction);
      if (existing) return this.transportInfo(existing.transport);
      const transport = await room.router.createWebRtcTransport(transportOptions(this.config));
      this.ensureLive(roomId, room, transport);
      peer.transports.set(transport.id, { transport, direction, connected: false });
      transport.observer.on('close', () => {
        peer.transports.delete(transport.id);
        this.notify({ roomId, peerId, event: 'transport_closed', data: { transportId: transport.id } });
      });
      transport.on('dtlsstatechange', (state) => {
        if (state === 'failed' || state === 'closed') transport.close();
      });
      return this.transportInfo(transport);
    });
  }

  connectTransport(roomId: string, peerId: string, id: string, dtlsParameters: DtlsParameters) {
    return this.operations.run(roomId, async () => {
      const entry = this.transport(roomId, peerId, id);
      if (!entry.connected) {
        await entry.transport.connect({ dtlsParameters });
        entry.connected = true;
      }
      return { connected: true };
    });
  }

  restartIce(roomId: string, peerId: string, id: string) {
    return this.operations.run(roomId, async () => ({
      iceParameters: await this.transport(roomId, peerId, id).transport.restartIce(),
    }));
  }

  produce(roomId: string, peerId: string, input: {
    transportId: string; kind: 'audio' | 'video'; rtpParameters: RtpParameters; mediaTag: MediaTag;
  }) {
    return this.operations.run(roomId, async () => {
      const { room, peer } = this.context(roomId, peerId);
      const entry = this.transport(roomId, peerId, input.transportId, 'send');
      if (!['audio', 'camera', 'screen'].includes(input.mediaTag) ||
          (input.mediaTag === 'audio' ? input.kind !== 'audio' : input.kind !== 'video')) {
        throw new Error('Media tag and kind do not match');
      }
      if ([...peer.producers.values()].some((producer) => producer.appData.mediaTag === input.mediaTag)) {
        throw new Error('Close the existing producer for this media tag first');
      }
      const producer = await entry.transport.produce({
        kind: input.kind, rtpParameters: input.rtpParameters, appData: { mediaTag: input.mediaTag },
      });
      this.ensureLive(roomId, room, producer);
      peer.producers.set(producer.id, producer);
      producer.observer.on('close', () => {
        peer.producers.delete(producer.id);
        this.notify({ roomId, event: 'producer_closed', data: { producerId: producer.id, peerId } });
      });
      for (const action of ['pause', 'resume'] as const) {
        producer.observer.on(action, () => this.notify({
          roomId, event: action === 'pause' ? 'producer_paused' : 'producer_resumed',
          data: { producerId: producer.id, peerId },
        }));
      }
      return this.producerInfo(peerId, producer);
    });
  }

  consume(roomId: string, peerId: string, input: { transportId: string; producerId: string; rtpCapabilities: RtpCapabilities }) {
    return this.operations.run(roomId, async () => {
      const { room, peer } = this.context(roomId, peerId);
      const entry = this.transport(roomId, peerId, input.transportId, 'recv');
      const source = this.producers(room, peerId).find((producer) => producer.producerId === input.producerId);
      if (!source || !room.router.canConsume(input)) throw new Error('Producer cannot be consumed in this room');
      const existing = [...peer.consumers.values()].find((consumer) => consumer.producerId === input.producerId);
      if (existing) return this.consumerInfo(existing, source);
      const consumer = await entry.transport.consume({
        producerId: input.producerId, rtpCapabilities: input.rtpCapabilities, paused: true,
      });
      this.ensureLive(roomId, room, consumer);
      peer.consumers.set(consumer.id, consumer);
      consumer.observer.on('close', () => {
        peer.consumers.delete(consumer.id);
        this.notify({ roomId, peerId, event: 'consumer_closed', data: { consumerId: consumer.id, producerId: consumer.producerId } });
      });
      return this.consumerInfo(consumer, source);
    });
  }

  resumeConsumer(roomId: string, peerId: string, id: string) {
    return this.operations.run(roomId, async () => {
      await this.consumer(roomId, peerId, id).resume();
      return { resumed: true };
    });
  }

  setPreferredLayers(roomId: string, peerId: string, id: string, spatialLayer: number, temporalLayer?: number) {
    return this.operations.run(roomId, async () => {
      const consumer = this.consumer(roomId, peerId, id);
      if (consumer.type !== 'simulcast' && consumer.type !== 'svc') throw new Error('Consumer has no selectable layers');
      await consumer.setPreferredLayers({ spatialLayer, temporalLayer });
      return { preferredLayers: consumer.preferredLayers };
    });
  }

  setProducerPaused(roomId: string, peerId: string, id: string, paused: boolean) {
    return this.operations.run(roomId, async () => {
      const producer = this.context(roomId, peerId).peer.producers.get(id);
      if (!producer) throw new Error('Producer does not belong to this peer');
      if (paused) await producer.pause(); else await producer.resume();
      return { paused: producer.paused };
    });
  }

  closeResource(roomId: string, peerId: string, kind: 'producer' | 'consumer' | 'transport', id: string) {
    return this.operations.run(roomId, () => {
      const { peer } = this.context(roomId, peerId);
      const resource = kind === 'producer' ? peer.producers.get(id)
        : kind === 'consumer' ? peer.consumers.get(id) : peer.transports.get(id)?.transport;
      if (!resource) throw new Error(`${kind} does not belong to this peer`);
      resource.close();
      return { closed: true };
    });
  }

  leave(roomId: string, peerId: string): Promise<void> {
    return this.operations.run(roomId, () => {
      const room = this.rooms.get(roomId);
      const peer = room?.peers.get(peerId);
      if (!room || !peer) return;
      this.closePeer(peer);
      room.peers.delete(peerId);
      if (!room.peers.size) this.closeRoomNow(roomId, room);
    });
  }

  closeRoom(roomId: string): Promise<void> {
    return this.operations.run(roomId, () => {
      const room = this.rooms.get(roomId);
      if (room) this.closeRoomNow(roomId, room);
    });
  }

  onModuleDestroy(): void {
    this.stopping = true;
    for (const [roomId, room] of this.rooms) this.closeRoomNow(roomId, room);
    this.events.removeAllListeners();
  }

  private closePeer(peer: MediaPeer): void {
    for (const consumer of [...peer.consumers.values()]) consumer.close();
    for (const producer of [...peer.producers.values()]) producer.close();
    for (const { transport } of [...peer.transports.values()]) transport.close();
    peer.consumers.clear(); peer.producers.clear(); peer.transports.clear();
  }

  private closeRoomNow(roomId: string, room: MediaRoom): void {
    this.rooms.delete(roomId);
    for (const peer of room.peers.values()) this.closePeer(peer);
    room.peers.clear();
    room.router.close();
  }

  private context(roomId: string, peerId: string) {
    const room = this.rooms.get(roomId);
    const peer = room?.peers.get(peerId);
    if (!room || room.router.closed || !peer) throw new Error('Peer has not joined this media room');
    return { room, peer };
  }

  private transport(roomId: string, peerId: string, id: string, direction?: TransportDirection) {
    const entry = this.context(roomId, peerId).peer.transports.get(id);
    if (!entry || entry.transport.closed || (direction && entry.direction !== direction)) {
      throw new Error('Transport is missing, owned by another peer, or has the wrong direction');
    }
    return entry;
  }

  private consumer(roomId: string, peerId: string, id: string): Consumer {
    const consumer = this.context(roomId, peerId).peer.consumers.get(id);
    if (!consumer || consumer.closed) throw new Error('Consumer does not belong to this peer');
    return consumer;
  }

  private ensureLive(roomId: string, room: MediaRoom, resource: { closed: boolean; close(): void }): void {
    if (this.rooms.get(roomId) !== room || room.router.closed || resource.closed) {
      resource.close();
      throw new Error('Media room closed during the request');
    }
  }

  private producers(room: MediaRoom, excludePeer: string): ProducerInfo[] {
    return [...room.peers].filter(([id]) => id !== excludePeer)
      .flatMap(([id, peer]) => [...peer.producers.values()].map((producer) => this.producerInfo(id, producer)));
  }

  private producerInfo(peerId: string, producer: Producer): ProducerInfo {
    return { producerId: producer.id, peerId, kind: producer.kind, mediaTag: producer.appData.mediaTag as MediaTag, paused: producer.paused };
  }

  private consumerInfo(consumer: Consumer, source: ProducerInfo) {
    return { id: consumer.id, producerId: consumer.producerId, kind: consumer.kind,
      rtpParameters: consumer.rtpParameters, producerPaused: consumer.producerPaused,
      peerId: source.peerId, mediaTag: source.mediaTag };
  }

  private transportInfo(transport: WebRtcTransport) {
    return { id: transport.id, iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates, dtlsParameters: transport.dtlsParameters };
  }
}
