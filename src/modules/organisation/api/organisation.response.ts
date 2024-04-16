import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';
import { Organisation } from '../domain/organisation.js';

export class OrganisationResponse {
    @AutoMap()
    @ApiProperty()
    public readonly id!: string;

    @AutoMap()
    @ApiProperty({ nullable: true })
    public readonly kennung?: string;

    @AutoMap()
    @ApiProperty()
    public readonly name!: string;

    @AutoMap()
    @ApiProperty({ nullable: true })
    public readonly namensergaenzung?: string;

    @AutoMap()
    @ApiProperty()
    public readonly kuerzel?: string;

    @AutoMap(() => String)
    @ApiProperty({ enum: OrganisationsTyp })
    public readonly typ!: OrganisationsTyp;

    @AutoMap(() => String)
    public traegerschaft?: Traegerschaft;

    public constructor(organisation: Organisation<true>) {
        this.id = organisation.id;
        this.kennung = organisation.kennung;
        this.name = organisation.name!;
        this.namensergaenzung = organisation.namensergaenzung;
        this.kuerzel = organisation.kuerzel;
        this.typ = organisation.typ!;
        this.traegerschaft = organisation.traegerschaft;
    }
}
