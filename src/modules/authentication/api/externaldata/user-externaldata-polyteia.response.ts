import { ApiProperty } from '@nestjs/swagger';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';

export class UserExternalDataResponsePolyteia {
    @ApiProperty({ enum: RollenArt, isArray: true })
    public rollenart: RollenArt[];

    public constructor(rollenart: RollenArt[]) {
        this.rollenart = rollenart;
    }
}
