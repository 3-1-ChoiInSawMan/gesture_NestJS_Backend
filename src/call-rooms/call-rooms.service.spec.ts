import { CallRoomsService } from './call-rooms.service';

describe('CallRoomsService active call cleanup', () => {
  const createService = () => {
    const coreHttpService = {
      post: jest.fn().mockResolvedValue({
        data: {
          callIdx: 3,
          roomIdx: 5,
          callEnded: true,
        },
        message: '통화에서 나갔습니다.',
      }),
      delete: jest.fn().mockResolvedValue({
        data: {
          roomIdx: 5,
          deleted: true,
        },
        message: '요청이 성공적으로 처리되었습니다.',
      }),
    };

    const mediasService = {
      uploadMedia: jest.fn(),
    };

    const service = new CallRoomsService(
      coreHttpService as never,
      mediasService as never,
    );

    return {
      service,
      coreHttpService,
    };
  };

  it('leaves active call before leaving call room', async () => {
    const { service, coreHttpService } = createService();

    await service.leaveCallRoomById(5, 7);

    expect(coreHttpService.post).toHaveBeenCalledWith('/calls/5/leave', undefined, {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(coreHttpService.delete).toHaveBeenCalledWith('/rooms/5/leave', {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(coreHttpService.post.mock.invocationCallOrder[0]).toBeLessThan(
      coreHttpService.delete.mock.invocationCallOrder[0],
    );
  });

  it('leaves active call before deleting call room', async () => {
    const { service, coreHttpService } = createService();

    await service.deleteCallRoomById(5, 7);

    expect(coreHttpService.post).toHaveBeenCalledWith('/calls/5/leave', undefined, {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(coreHttpService.delete).toHaveBeenCalledWith('/rooms/5', {
      headers: {
        'X-User-Id': 7,
      },
    });
    expect(coreHttpService.post.mock.invocationCallOrder[0]).toBeLessThan(
      coreHttpService.delete.mock.invocationCallOrder[0],
    );
  });

  it('continues leaving call room when there is no active call to clean up', async () => {
    const { service, coreHttpService } = createService();

    coreHttpService.post.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          statusCode: 'CALL_003',
        },
      },
    });

    await service.leaveCallRoomById(5, 7);

    expect(coreHttpService.delete).toHaveBeenCalledWith('/rooms/5/leave', {
      headers: {
        'X-User-Id': 7,
      },
    });
  });

  it('continues deleting call room when the current user is not an active call participant', async () => {
    const { service, coreHttpService } = createService();

    coreHttpService.post.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          statusCode: 'CALL_002',
        },
      },
    });

    await service.deleteCallRoomById(5, 7);

    expect(coreHttpService.delete).toHaveBeenCalledWith('/rooms/5', {
      headers: {
        'X-User-Id': 7,
      },
    });
  });
});
