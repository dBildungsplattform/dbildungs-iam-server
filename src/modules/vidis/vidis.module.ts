import { Module } from '@nestjs/common';
import { VidisService } from './vidis.service.js';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    providers: [VidisService],
    exports: [VidisService],
})
export class VidisModule {}
