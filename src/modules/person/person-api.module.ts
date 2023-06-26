import { Module } from '@nestjs/common';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';

@Module({
    imports: [PersonModule],
    providers: [PersonUc],
    controllers: [PersonController],
})
export class PersonApiModule {}
