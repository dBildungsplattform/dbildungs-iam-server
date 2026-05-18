import { ApiProperty } from '@nestjs/swagger';
import { RolleID } from '../../../../shared/types/aggregate-ids.types.js';

export class UserExternalDataResponseIqshHelpdeskPk {
    @ApiProperty()
    public rolleId: RolleID;

    @ApiProperty()
    public dstNr: string;

    public constructor(rolleId: RolleID, dstNr: string) {
        this.rolleId = rolleId;
        this.dstNr = dstNr;
    }
}
