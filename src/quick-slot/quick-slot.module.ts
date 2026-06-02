import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';
import { QuickSlotController } from './quick-slot.controller';
import { QuickSlotService } from './quick-slot.service';

@Module({
  imports: [
    AuthModule,
    CoreHttpModule,
  ],
  controllers: [QuickSlotController],
  providers: [QuickSlotService],
})
export class QuickSlotModule {}
