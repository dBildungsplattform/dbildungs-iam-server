import { ApiProperty } from '@nestjs/swagger';
import { Rolle } from '../../rolle/domain/rolle.js';

export class FindRollenResponse {
    @ApiProperty({ type: [Rolle<true>] })
    public moeglicheRollen!: Rolle<true>[];

    @ApiProperty({ type: Number })
    public total!: number;
}
