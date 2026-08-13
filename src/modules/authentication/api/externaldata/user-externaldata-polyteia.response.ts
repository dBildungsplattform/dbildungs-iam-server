import { ApiProperty } from '@nestjs/swagger';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';

export class UserExternalDataResponsePolyteia {
    @ApiProperty({ enum: RollenArt })
    public rollenart?: RollenArt;

    @ApiProperty({ type: [String] })
    public dienststellenNummern: string[];

    public constructor(dienststellenNummern: string[], rollenart?: RollenArt) {
        this.rollenart = rollenart;
        this.dienststellenNummern = dienststellenNummern;
    }
}
