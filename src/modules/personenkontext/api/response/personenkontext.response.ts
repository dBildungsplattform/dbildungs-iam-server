import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisationDto } from '../created-personenkontext-organisation.dto.js';
import { LoeschungResponse } from '../../../person/api/loeschung.response.js';

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

    @AutoMap(() => CreatedPersonenkontextOrganisationDto)
    @ApiProperty({ type: CreatedPersonenkontextOrganisationDto })
    public organisation!: CreatedPersonenkontextOrganisationDto;

    @AutoMap(() => String)
    @ApiProperty({ enum: Rolle })
    public rolle!: Rolle;

    @AutoMap(() => String)
    @ApiProperty({ enum: Personenstatus, nullable: true })
    public personenstatus?: Personenstatus;

    @AutoMap(() => String)
    @ApiProperty({ enum: Jahrgangsstufe, nullable: true })
    public jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap(() => String)
    @ApiProperty({ enum: SichtfreigabeType, nullable: true })
    public sichtfreigabe?: SichtfreigabeType;

    @AutoMap(() => LoeschungResponse)
    @ApiProperty({ type: LoeschungResponse, nullable: true })
    public loeschung?: LoeschungResponse;

    @AutoMap()
    @ApiProperty()
    public revision!: string;

    public static new(props: Readonly<PersonenkontextResponse>): PersonenkontextResponse {
        const response: PersonenkontextResponse = new PersonenkontextResponse();

        response.id = props.id;
        response.referrer = props.referrer;
        response.mandant = props.mandant;
        response.organisation = CreatedPersonenkontextOrganisationDto.new(props.organisation);
        response.rolle = props.rolle;
        response.personenstatus = props.personenstatus;
        response.jahrgangsstufe = props.jahrgangsstufe;
        response.sichtfreigabe = props.sichtfreigabe;
        response.loeschung = props.loeschung
            ? LoeschungResponse.new({ zeitpunkt: props.loeschung.zeitpunkt })
            : undefined;
        response.revision = props.revision;

        return response;
    }
}
