import { Injectable } from '@nestjs/common';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { Gruppe } from './gruppe.js';

@Injectable()
export class GruppenFactory {
    public createGroup(createGroupBodyParams: CreateGroupBodyParams): Gruppe {
        return Gruppe.createGroup(createGroupBodyParams);
    }
}
