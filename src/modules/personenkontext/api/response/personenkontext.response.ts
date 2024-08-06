import { ApiProperty } from '@nestjs/swagger';
import { Jahrgangsstufe, Personenstatus, SichtfreigabeType } from '../../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisation } from '../created-personenkontext-organisation.js';
import { LoeschungResponse } from '../../../person/api/loeschung.response.js';
import { AutoMap } from '@automapper/classes';

export class PersonenkontextResponse {
    @AutoMap()
    @ApiProperty()
    public id!: string;

    @AutoMap()
    @ApiProperty({ nullable: true })
    public referrer?: string;

    @AutoMap()
    @ApiProperty()
    public mandant!: string;

    @AutoMap(() => CreatedPersonenkontextOrganisation)
    @ApiProperty({ type: CreatedPersonenkontextOrganisation })
    public organisation!: CreatedPersonenkontextOrganisation;

    @AutoMap()
    @ApiProperty({ nullable: true })
    public roleName?: string;

    @AutoMap(() => String)
    @ApiProperty({ enum: Personenstatus, nullable: true })
    public personenstatus?: Personenstatus;

    @AutoMap(() => String)
    @ApiProperty({ enum: Jahrgangsstufe, nullable: true })
    public jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    @ApiProperty({ enum: SichtfreigabeType, nullable: true })
    public sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => String)
    @ApiProperty({ type: LoeschungResponse, nullable: true })
    public loeschung?: LoeschungResponse;

    @AutoMap()
    @ApiProperty()
    public revision!: string;

    public constructor(props: Readonly<PersonenkontextResponse>) {
        this.id = props.id;
        this.referrer = props.referrer;
        this.mandant = props.mandant!;
        this.organisation = props.organisation;
        this.personenstatus = props.personenstatus;
        this.jahrgangsstufe = props.jahrgangsstufe;
        this.sichtfreigabe = props.sichtfreigabe;
        this.loeschung = props.loeschung;
        this.revision = props.revision;
    }
}
