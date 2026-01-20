import { Injectable } from '@nestjs/common';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';

import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { CreatedPersonenkontextOrganisation } from '../../personenkontext/api/created-personenkontext-organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { LoeschungResponse } from '../api/loeschung.response.js';

@Injectable()
export class PersonApiMapper {
    public async mapToPersonenkontextResponse(props: Personenkontext<true>): Promise<PersonenkontextResponse> {
        const rolle: Option<Rolle<true>> = await props.getRolle();
        const response: PersonenkontextResponse = new PersonenkontextResponse({
            id: props.id,
            username: props.username,
            mandant: props.mandant!,
            organisation: CreatedPersonenkontextOrganisation.new({ id: props.organisationId }),
            rollenart: rolle?.rollenart,
            rollenname: rolle?.name,
            personenstatus: props.personenstatus,
            jahrgangsstufe: props.jahrgangsstufe,
            sichtfreigabe: props.sichtfreigabe,
            loeschung: props.loeschungZeitpunkt
                ? LoeschungResponse.new({ zeitpunkt: props.loeschungZeitpunkt })
                : undefined,
            revision: props.revision,
        });

        return response;
    }
}
