import { Module } from '@nestjs/common';

import { ImportController } from './api/import.controller.js';

@Module({
    imports: [],
    providers: [],
    controllers: [ImportController],
})
export class ImportApiModule {}
