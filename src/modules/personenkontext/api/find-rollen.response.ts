import { ApiProperty } from '@nestjs/swagger';
import { Rolle } from '../../rolle/domain/rolle.js';

export class FindRollenResponse {
    public constructor(moeglicheRollen: Rolle<true>[], total: number) {
        this.moeglicheRollen = moeglicheRollen;
        this.total = total;
    }

    @ApiProperty({ type: [Rolle<true>] })
    public moeglicheRollen: Rolle<true>[];

    @ApiProperty({ type: Number })
    public total: number;
}
