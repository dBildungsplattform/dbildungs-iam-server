import { ApiProperty } from '@nestjs/swagger';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { RolleResponse } from '../../../rolle/api/rolle.response.js';

export class FindRollenResponse {
    public constructor(moeglicheRollen: Rolle<true>[], total: number) {
        this.moeglicheRollen = moeglicheRollen.map((rolle: Rolle<true>) => new RolleResponse(rolle));
        this.total = total;
    }

    @ApiProperty({ type: [RolleResponse] })
    public readonly moeglicheRollen: RolleResponse[];

    @ApiProperty({ type: Number })
    public readonly total: number;
}
