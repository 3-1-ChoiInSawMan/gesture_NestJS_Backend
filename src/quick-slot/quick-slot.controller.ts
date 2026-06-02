import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { JwtPayload } from 'src/common/jwt-payload.interface';
import { GetUser } from 'src/decorators/get-user.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { AddQuickSlotDto } from './clientDto/request/add-quick-slot.dto';
import { EditQuickSlotDto } from './clientDto/request/edit-quick-slot.dto';
import { SetPresetDto } from './clientDto/request/set-preset.dto';
import { QuickSlotService } from './quick-slot.service';

@Controller({ path: '/quick-slot', version: '1' })
export class QuickSlotController {
  constructor(
    private readonly quickSlotService: QuickSlotService,
  ) { };

  @UseGuards(JwtGuard)
  @Post()
  async addQuickSlot(
    @Body() body: AddQuickSlotDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.quickSlotService.addQuickSlot(body, user.idx);

    return {
      data: {
        quickSlot: data,
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Get()
  async getUploadedQuickSlots(
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.quickSlotService.getUploadedQuickSlots(user.idx);

    return {
      data: {
        quickSlots: data,
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Get('/preset')
  async getActivePreset(
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.quickSlotService.getActivePreset(user.idx);

    return {
      data: {
        preset: data,
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Patch('/preset')
  async setPreset(
    @Body() body: SetPresetDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.quickSlotService.setPreset(body, user.idx);

    return {
      data: {
        preset: data,
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Patch('/:quickSlotIdx')
  async editQuickSlot(
    @Param('quickSlotIdx', new ParseIntPipe()) quickSlotIdx: number,
    @Body() body: EditQuickSlotDto,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.quickSlotService.editQuickSlot(quickSlotIdx, body, user.idx);

    return {
      data: {
        quickSlot: data,
      },
      message,
    };
  }

  @UseGuards(JwtGuard)
  @Delete('/:quickSlotIdx')
  async deleteQuickSlot(
    @Param('quickSlotIdx', new ParseIntPipe()) quickSlotIdx: number,
    @GetUser() user: JwtPayload,
  ) {
    const { data, message } = await this.quickSlotService.deleteQuickSlot(quickSlotIdx, user.idx);

    return {
      data: {
        quickSlot: data,
      },
      message,
    };
  }
}
