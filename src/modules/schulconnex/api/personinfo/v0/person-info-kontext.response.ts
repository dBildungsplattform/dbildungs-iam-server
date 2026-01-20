import { ApiProperty } from '@nestjs/swagger';
import { LoeschungResponse } from '../../../../person/api/loeschung.response.js';
import { RollenArt } from '../../../../rolle/domain/rolle.enums.js';
import {
    Personenstatus,
    Jahrgangsstufe,
    SichtfreigabeType,
} from '../../../../personenkontext/domain/personenkontext.enums.js';
import { PersonenInfoKontextOrganisationResponse } from './person-info-kontext-organisation.response.js';

export class PersonenInfoKontextResponse {
    @ApiProperty()
    public id!: string;

    @ApiProperty({ nullable: true })
    public username?: string;

    @ApiProperty()
    public mandant!: string;

    @ApiProperty({ type: PersonenInfoKontextOrganisationResponse })
    public organisation!: PersonenInfoKontextOrganisationResponse;

    @ApiProperty({ nullable: true })
    public rollenart?: RollenArt;

    @ApiProperty({ nullable: true })
    public rollenname?: string;

    @ApiProperty({ enum: Personenstatus, nullable: true })
    public personenstatus?: Personenstatus;

    @ApiProperty({ enum: Jahrgangsstufe, nullable: true })
    public jahrgangsstufe?: Jahrgangsstufe;

    @ApiProperty({ enum: SichtfreigabeType, nullable: true })
    public sichtfreigabe?: SichtfreigabeType;

    @ApiProperty({ type: LoeschungResponse, nullable: true })
    public loeschung?: LoeschungResponse;

    @ApiProperty()
    public revision!: string;

    public constructor(props: Readonly<PersonenInfoKontextResponse>) {
        this.id = props.id;
        this.username = props.username;
        this.mandant = props.mandant!;
        this.organisation = props.organisation;
        this.personenstatus = props.personenstatus;
        this.jahrgangsstufe = props.jahrgangsstufe;
        this.sichtfreigabe = props.sichtfreigabe;
        this.loeschung = props.loeschung;
        this.revision = props.revision;
        this.rollenart = props.rollenart;
        this.rollenname = props.rollenname;
    }
}
