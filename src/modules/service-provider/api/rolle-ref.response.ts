import { ApiProperty } from '@nestjs/swagger';

import { RolleID } from '../../../shared/types/index.js';
import { Rolle } from '../../rolle/domain/rolle.js';

export class RolleRefResponse {
    @ApiProperty()
    public id: RolleID;

    @ApiProperty()
    public name: string;

    public constructor(id: RolleID, name: string) {
        this.id = id;
        this.name = name;
    }

    public static fromRolle(organisation: Rolle<true>): RolleRefResponse {
        return new RolleRefResponse(organisation.id, organisation.name);
    }
}
