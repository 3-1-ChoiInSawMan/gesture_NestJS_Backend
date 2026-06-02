import { Injectable } from '@nestjs/common';
import { CoreHttpService } from 'src/core-http/core-http.service';
import type { AddQuickSlotRequest } from './coreInterface/request/AddQuickSlot.interface';
import type { EditQuickSlotRequest } from './coreInterface/request/EditQuickSlot.interface';
import type { SetPresetRequest } from './coreInterface/request/SetPreset.interface';
import type { AddQuickSlotResponse } from './coreInterface/response/AddQuickSlot.interface';
import type { DeleteQuickSlotResponse } from './coreInterface/response/DeleteQuickSlot.interface';
import type { EditQuickSlotResponse } from './coreInterface/response/EditQuickSlot.interface';
import type { GetActivePresetResponse } from './coreInterface/response/GetActivePreset.interface';
import type { GetUploadedQuickSlotsResponse } from './coreInterface/response/GetUploadedQuickSlots.interface';
import type { SetPresetResponse } from './coreInterface/response/SetPreset.interface';
import type { AddQuickSlotDto } from './clientDto/request/add-quick-slot.dto';
import type { EditQuickSlotDto } from './clientDto/request/edit-quick-slot.dto';
import type { SetPresetDto } from './clientDto/request/set-preset.dto';

@Injectable()
export class QuickSlotService {
  constructor(
    private readonly coreHttpService: CoreHttpService,
  ) { };

  async addQuickSlot(
    body: AddQuickSlotDto,
    userIdx: number,
  ) {
    const request: AddQuickSlotRequest = {
      icon_uuid: body.iconUuid,
      name: body.name,
      description: body.description,
    };

    return this.coreHttpService.post<AddQuickSlotResponse>('/quick-slots', request, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getUploadedQuickSlots(
    userIdx: number,
  ) {
    return this.coreHttpService.get<GetUploadedQuickSlotsResponse>('/quick-slots', {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async getActivePreset(
    userIdx: number,
  ) {
    return this.coreHttpService.get<GetActivePresetResponse>('/quick-slots/preset', {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async setPreset(
    body: SetPresetDto,
    userIdx: number,
  ) {
    const request: SetPresetRequest = {
      quick_slot_ids: body.quickSlotIds,
    };

    return this.coreHttpService.patch<SetPresetResponse>('/quick-slots/preset', request, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async editQuickSlot(
    quickSlotIdx: number,
    body: EditQuickSlotDto,
    userIdx: number,
  ) {
    const request: EditQuickSlotRequest = {
      name: body.name,
      description: body.description,
      icon_uuid: body.iconUuid,
    };

    return this.coreHttpService.patch<EditQuickSlotResponse>(`/quick-slots/${quickSlotIdx}`, request, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }

  async deleteQuickSlot(
    quickSlotIdx: number,
    userIdx: number,
  ) {
    return this.coreHttpService.delete<DeleteQuickSlotResponse>(`/quick-slots/${quickSlotIdx}`, {
      headers: {
        'X-User-Id': userIdx,
      },
    });
  }
}
