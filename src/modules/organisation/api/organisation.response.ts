import { AutoMap } from '@automapper/classes';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { ApiProperty } from '@nestjs/swagger';

export class OrganisationResponse {
    @AutoMap()
    @ApiProperty()
    public readonly id!: string;

    @AutoMap()
    @ApiProperty()
    public readonly kennung!: string;

    @AutoMap()
    @ApiProperty()
    public readonly name!: string;

    @AutoMap()
    @ApiProperty()
    public readonly namensergaenzung!: string;

    @AutoMap()
    @ApiProperty()
    public readonly kuerzel!: string;

    @AutoMap()
    @ApiProperty({ enum: OrganisationsTyp })
    public readonly typ!: OrganisationsTyp;
}
