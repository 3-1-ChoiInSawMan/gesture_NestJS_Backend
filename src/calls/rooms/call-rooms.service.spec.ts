import { CallRoomsService } from './call-rooms.service';
import { CallRoomCategory } from './enums/call-room-category.enum';

describe('CallRoomsService', () => {
  const setup = () => {
    const result = { data: { roomIdx: 7 }, message: 'ok' };
    const core = { post: jest.fn().mockResolvedValue(result), delete: jest.fn().mockResolvedValue(result) };
    const calls = { closeRoom: jest.fn().mockResolvedValue(undefined), leaveActiveCall: jest.fn().mockResolvedValue(undefined) };
    const service = new CallRoomsService(core as never, { uploadMedia: jest.fn() } as never, calls as never);
    return { service, core, calls };
  };

  it('creates the persistent room through Core using the existing payload format', async () => {
    const { service, core } = setup();
    await service.createCallRoom(undefined, {
      title: 'Test', description: 'Room', maxParticipant: 4,
      category: CallRoomCategory.BASIC, isPublic: true, password: '',
    }, 11);
    expect(core.post).toHaveBeenCalledWith('/rooms', expect.objectContaining({ title: 'Test', max_participant: 4, thumbnail_uuid: null }), { headers: { 'X-User-Id': 11 } });
  });

  it('closes active media only after Core authorizes room deletion', async () => {
    const { service, core, calls } = setup();
    core.delete.mockRejectedValueOnce(new Error('forbidden'));
    await expect(service.deleteCallRoomById(7, 11)).rejects.toThrow('forbidden');
    expect(calls.closeRoom).not.toHaveBeenCalled();
    await service.deleteCallRoomById(7, 11);
    expect(calls.closeRoom).toHaveBeenCalledWith(7);
  });

  it('releases the active call after leaving persistent room membership', async () => {
    const { service, calls } = setup();
    await service.leaveCallRoomById(7, 11);
    expect(calls.leaveActiveCall).toHaveBeenCalledWith(7, 11);
  });
});
