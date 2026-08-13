import { ApiProperty } from '@nestjs/swagger';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';

export class UserExternalDataResponsePolyteia {
    @ApiProperty({ enum: RollenArt, isArray: true })
    public rollenart: RollenArt[];

    @ApiProperty({ type: [String] })
    public dienststellenNummern: string[];

    public constructor(rollenart: RollenArt[], dienststellenNummern: string[]) {
        this.rollenart = rollenart;
        this.dienststellenNummern = dienststellenNummern;
    }
}
