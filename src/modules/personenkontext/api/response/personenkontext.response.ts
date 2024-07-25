import { ApiProperty } from '@nestjs/swagger';
import { Jahrgangsstufe, Personenstatus, SichtfreigabeType } from '../../domain/personenkontext.enums.js';
import { CreatedPersonenkontextOrganisation } from '../created-personenkontext-organisation.js';
import { LoeschungResponse } from '../../../person/api/loeschung.response.js';
import { Personenkontext } from '../../domain/personenkontext.js';
import { Rolle } from '../../../rolle/domain/rolle.js';

export class PersonenkontextResponse {
    @ApiProperty()
    public id!: string;

    @ApiProperty({ nullable: true })
    public referrer?: string;

    @ApiProperty()
    public mandant!: string;

    @ApiProperty({ type: CreatedPersonenkontextOrganisation })
    public organisation!: CreatedPersonenkontextOrganisation;

    // @ApiProperty({ enum: Rolle }) public rolle!: Rolle;

    @ApiProperty({ nullable: true })
    public roleName?: string;

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

    public constructor(props: Readonly<PersonenkontextResponse>) {
        this.id = props.id;
        this.referrer = props.referrer;
        this.mandant = props.mandant!;
        this.organisation = props.organisation;
        // this.rolle = props.rolle;
        this.personenstatus = props.personenstatus;
        this.jahrgangsstufe = props.jahrgangsstufe;
        this.sichtfreigabe = props.sichtfreigabe;
        this.loeschung = props.loeschung;
        this.revision = props.revision;
    }

    public static async construct(props: Personenkontext<true>): Promise<PersonenkontextResponse> {
        const rolle: Option<Rolle<true>> = await props.getRolle();
        const response: PersonenkontextResponse = new PersonenkontextResponse({
            id: props.id,
            referrer: props.referrer,
            mandant: props.mandant!,
            organisation: CreatedPersonenkontextOrganisation.new({ id: props.organisationId }),
            personenstatus: props.personenstatus,
            jahrgangsstufe: props.jahrgangsstufe,
            sichtfreigabe: props.sichtfreigabe,
            loeschung: props.loeschungZeitpunkt
                ? LoeschungResponse.new({ zeitpunkt: props.loeschungZeitpunkt })
                : undefined,
            revision: props.revision,
        });

        response.roleName = rolle ? rolle.name : undefined;

        return response;
    }
}
