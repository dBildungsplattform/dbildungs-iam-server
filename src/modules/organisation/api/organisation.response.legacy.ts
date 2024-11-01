import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp, OrganisationsTypName, Traegerschaft } from '../domain/organisation.enums.js';
import { Organisation } from '../domain/organisation.js';

export class OrganisationResponseLegacy {
    //Legacy Response With Automapper used for Non DDD Architecture

    @ApiProperty()
    public readonly id!: string;

    @ApiProperty({ nullable: true })
    public readonly administriertVon?: string;

    @ApiProperty({ nullable: true })
    public readonly kennung?: string;

    @ApiProperty()
    public readonly name!: string;

    @ApiProperty({ nullable: true })
    public readonly namensergaenzung?: string;

    @ApiProperty()
    public readonly kuerzel?: string;

    @ApiProperty({ enum: OrganisationsTyp, enumName: OrganisationsTypName })
    public readonly typ!: OrganisationsTyp;

    public traegerschaft?: Traegerschaft;

    public constructor(props: Organisation<true>) {
        this.id = props.id!;
        this.administriertVon = props.administriertVon;
        this.kennung = props.kennung;
        this.name = props.name!;
        this.namensergaenzung = props.namensergaenzung;
        this.kuerzel = props.kuerzel!;
        this.typ = props.typ!;
        this.traegerschaft = props.traegerschaft;
    }
}
