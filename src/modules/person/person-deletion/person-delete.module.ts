import { Module } from '@nestjs/common';
import { PersonModule } from '../person.module.js';
import { PersonDeleteService } from './person-delete.service.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';

@Module({
    imports: [PersonModule, PersonenKontextModule],
    providers: [PersonDeleteService],
    exports: [PersonDeleteService],
})
export class PersonDeleteModule {}
