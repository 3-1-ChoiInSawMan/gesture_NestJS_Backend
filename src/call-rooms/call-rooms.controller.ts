import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CallRoomsService } from "./call-rooms.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { CreateCallRoomDto } from "./dto/request/create-call-room.dto";
import { GetUser } from "src/decorators/get-user.decorator";
import { type JwtPayload } from "src/common/jwt-payload.interface";
import { JoinCallRoomDto } from "./dto/request/join-call-room.dto";
import { GetCallRoomsQueryDto } from "./dto/request/get-call-rooms-query.dto";
import { GetCallRoomsByKeywordQueryDto } from "./dto/request/get-call-room-by-keyword-query.dto";
import { JwtGuard } from "src/guards/jwt.guard";
import { UpdateCallRoomDto } from "./dto/request/update-call-room.dto";

@Controller({ path: '/call-rooms', version: '1' })
export class CallRoomsController {
  constructor(
    private readonly callRoomsService: CallRoomsService
  ) { };

  // 통화방 참여
  @UseGuards(JwtGuard)
  @Post('/:roomIdx/join')
  async handleJoinCallRoom(
    @Body() body: JoinCallRoomDto,
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.callRoomsService.joinCallRoom(body, roomIdx, user.idx);

    return {
      data: {
        room: data
      },
      message,
    };
  }

  // 통화방 생성
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail_image'))
  @Post()
  async handleCreateCallRoom(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateCallRoomDto,
    @GetUser() user: JwtPayload
  ) {
    const { data, uploadedFile } = await this.callRoomsService.createCallRoom(file, body, user.idx);

    const roomEntity = data.data;
    const message = data.message;

    const room = {
      room_idx: roomEntity.room_idx,
      host_user_idx: roomEntity.host_user_idx,
      title: roomEntity.title,
      is_public: roomEntity.is_public,
      category: roomEntity.category,
      max_participant: roomEntity.max_participant,
      thumbnail_url: uploadedFile?.file_url,
      created_at: roomEntity.created_at
    };

    return {
      data: {
        room
      },
      message,
    };
  }

  // 통화방 목록 조회
  @Get()
  async handleGetCallRooms(
    @Query() query: GetCallRoomsQueryDto
  ) {
    const { data, message } = await this.callRoomsService.getCallRooms(query);

    return {
      data: {
        rooms: data
      },
      message
    };
  }

  // 통화방 검색
  @Get('/search')
  async handleGetCallRoomByKeyword(
    @Query() query: GetCallRoomsByKeywordQueryDto
  ) {
    const { data, message } = await this.callRoomsService.getCallRoomsByKeyword(query);

    return {
      data: {
        rooms: data,
      },
      message,
    };
  }

  // 통화방 상세 조회
  @Get('/:roomIdx')
  async handleGetCallRoomById(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number
  ) {
    const { data, message } = await this.callRoomsService.getCallRoomById(roomIdx);

    return {
      data: {
        room: data,
      },
      message
    };
  }

  // 통화방 수정
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail_image'))
  @Patch('/:roomIdx')
  async handleUpdateCallRoomById(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UpdateCallRoomDto,
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, uploadedFile } = await this.callRoomsService.updateCallRoomById(file, body, roomIdx, user.idx);

    const roomEntity = data.data;
    const message = data.message;

    const room = {
      room_idx: roomEntity.room_idx,
      host_user_idx: roomEntity.host_user_idx,
      title: roomEntity.title,
      is_public: roomEntity.is_public,
      category: roomEntity.category,
      max_participant: roomEntity.max_participant,
      thumbnail_url: uploadedFile?.file_url,
      created_at: roomEntity.created_at
    };

    return {
      data: {
        room
      },
      message
    };
  }

  // 통화방 삭제
  @UseGuards(JwtGuard)
  @Delete('/:roomIdx')
  async handleDeleteCallRoomById(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.callRoomsService.deleteCallRoomById(roomIdx, user.idx);

    return {
      data: {
        room: data,
      },
      message
    };
  }
}
