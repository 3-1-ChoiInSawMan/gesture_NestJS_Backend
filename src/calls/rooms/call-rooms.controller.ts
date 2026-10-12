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

  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail_image'))
  @Post()
  async handleCreateCallRoom(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateCallRoomDto,
    @GetUser() user: JwtPayload
  ) {
    const { response, fileUUID } = await this.callRoomsService.createCallRoom(file, body, user.idx);

    const _room = {
      ...response.data,
      thumbnailUUID: fileUUID
    };

    return {
      data: {
        room: _room
      },
      message: response.message,
    };
  }

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

  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('thumbnail_image'))
  @Patch('/:roomIdx')
  async handleUpdateCallRoomById(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UpdateCallRoomDto,
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { response, fileUUID } = await this.callRoomsService.updateCallRoomById(file, body, roomIdx, user.idx);

    const _room = {
      ...response.data,
      thumbnail_uuid: fileUUID
    };

    return {
      data: {
        room: _room
      },
      message: response.message
    };
  }

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

  @UseGuards(JwtGuard)
  @Delete('/:roomIdx/leave')
  async handleLeaveCallRoomById(
    @Param('roomIdx', new ParseIntPipe()) roomIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.callRoomsService.leaveCallRoomById(roomIdx, user.idx);

    return {
      data: {
        room: data,
      },
      message
    };
  }
}
