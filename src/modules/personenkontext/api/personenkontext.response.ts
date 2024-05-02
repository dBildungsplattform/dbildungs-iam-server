import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisationDto } from './created-personenkontext-organisation.dto.js';
import { LoeschungResponse } from '../../person/api/loeschung.response.js';

export class PersonenkontextResponse {
    @AutoMap()
    @ApiProperty()
    public readonly id: string;

    @AutoMap()
    @ApiProperty({ nullable: true })
    public readonly referrer?: string;

    @AutoMap()
    @ApiProperty()
    public readonly mandant: string;

    @AutoMap(() => CreatedPersonenkontextOrganisationDto)
    @ApiProperty({ type: CreatedPersonenkontextOrganisationDto })
    public readonly organisation: CreatedPersonenkontextOrganisationDto;

    @AutoMap(() => String)
    @ApiProperty({ enum: Rolle })
    public readonly rolle: Rolle;

    @AutoMap(() => String)
    @ApiProperty({ enum: Personenstatus, nullable: true })
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    @ApiProperty({ enum: Jahrgangsstufe, nullable: true })
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    @ApiProperty({ enum: SichtfreigabeType, nullable: true })
    public readonly sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => LoeschungResponse)
    @ApiProperty({ type: LoeschungResponse, nullable: true })
    public readonly loeschung: LoeschungResponse;

    @AutoMap()
    @ApiProperty()
    public readonly revision: string;

    public constructor(props: Readonly<PersonenkontextResponse>) {
        this.id = props.id;
        this.referrer = props.referrer;
        this.mandant = props.mandant;
        this.organisation = new CreatedPersonenkontextOrganisationDto(props.organisation);
        this.rolle = props.rolle;
        this.personenstatus = props.personenstatus;
        this.jahrgangsstufe = props.jahrgangsstufe;
        this.sichtfreigabe = props.sichtfreigabe;
        this.loeschung = new LoeschungResponse(props.loeschung);
        this.revision = props.revision;
    }
}
