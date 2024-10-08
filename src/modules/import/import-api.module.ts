import { Module } from '@nestjs/common';

import { ImportController } from './api/import.controller.js';
import { ImportModule } from './import.module.js';

@Module({
    imports: [ImportModule],
    providers: [],
    controllers: [ImportController],
})
export class ImportApiModule {}
