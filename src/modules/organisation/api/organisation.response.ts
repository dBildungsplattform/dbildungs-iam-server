import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';

export class OrganisationResponse {
    @AutoMap()
    @ApiProperty()
    public readonly id!: string;

    @AutoMap()
    @ApiProperty()
    public readonly kennung?: string;

    @AutoMap()
    @ApiProperty()
    public readonly name!: string;

    @AutoMap()
    @ApiProperty()
    public readonly namensergaenzung?: string;

    @AutoMap()
    @ApiProperty()
    public readonly kuerzel?: string;

    @AutoMap(() => String)
    @ApiProperty({ enum: OrganisationsTyp })
    public readonly typ!: OrganisationsTyp;

    @AutoMap(() => String)
    public traegerschaft?: Traegerschaft;
}
