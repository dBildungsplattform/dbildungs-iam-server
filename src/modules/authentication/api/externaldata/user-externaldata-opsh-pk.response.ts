import { ApiProperty } from '@nestjs/swagger';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';

export class UserExeternalDataResponseOpshPk {
    @ApiProperty()
    public rollenArt: RollenArt;

    @ApiProperty()
    public dstNr: string;

    public constructor(rollenArt: RollenArt, dstNr: string) {
        this.rollenArt = rollenArt;
        this.dstNr = dstNr;
    }
}
