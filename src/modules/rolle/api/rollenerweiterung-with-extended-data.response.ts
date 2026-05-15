import { ApiProperty } from '@nestjs/swagger';
import { RollenerweiterungResponse } from './rollenerweiterung.response.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { Rolle } from '../domain/rolle.js';
import { Organisation } from '../../organisation/domain/organisation.js';

export class RollenerweiterungWithExtendedDataResponse extends RollenerweiterungResponse {
    public constructor(
        rollenerweiterung: Rollenerweiterung<true>,
        rolle: Option<Rolle<true>>,
        organisation: Option<Organisation<true>>,
    ) {
        super(rollenerweiterung);
        this.rolleName = rolle?.name ?? '';
        this.organisationName = organisation?.name ?? '';
        this.organisationKennung = organisation?.kennung ?? '';
    }

    @ApiProperty()
    public rolleName: string;

    @ApiProperty()
    public organisationName: string;

    @ApiProperty()
    public organisationKennung: string;
}
