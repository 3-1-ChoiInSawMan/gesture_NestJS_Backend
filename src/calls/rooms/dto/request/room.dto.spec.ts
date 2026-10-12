import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCallRoomDto } from './create-call-room.dto';
import { UpdateCallRoomDto } from './update-call-room.dto';

describe('Call room form validation', () => {
  const body = { title: 'Test', description: 'Room', category: 'BASIC', maxParticipant: '4', isPublic: 'false' };

  it('requires a password when creating a private room from multipart fields', async () => {
    const dto = plainToInstance(CreateCallRoomDto, body);
    expect(dto.isPublic).toBe(false);
    expect(dto.maxParticipant).toBe(4);
    expect((await validate(dto)).map((error) => error.property)).toContain('password');
    expect(await validate(plainToInstance(CreateCallRoomDto, { ...body, password: '1234' }))).toEqual([]);
  });

  it('rejects malformed boolean values and passwords during updates', async () => {
    const errors = await validate(plainToInstance(UpdateCallRoomDto, { isPublic: 'invalid', password: 'x' }));
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['isPublic', 'password']));
  });
});
