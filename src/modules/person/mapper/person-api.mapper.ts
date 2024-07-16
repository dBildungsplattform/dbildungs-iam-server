import { Injectable } from '@nestjs/common';
import { PersonInfoResponse } from '../api/person-info.response.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { PersonDo } from '../domain/person.do.js';

import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';

@Injectable()
export class PersonApiMapper {
    public async mapToPersonInfoResponse(
        person: PersonDo<true>,
        kontexte: Personenkontext<true>[],
    ): Promise<PersonInfoResponse> {
        const personenkontexte: PersonenkontextResponse[] = await Promise.all(
            kontexte.map((kontext: Personenkontext<true>) => this.mapToPersonenkontextResponse(kontext)),
        );

        const response: PersonInfoResponse = new PersonInfoResponse({
            pid: person.id,
            person: {
                id: person.id,
                referrer: person.referrer,
                mandant: person.mandant,
                name: {
                    titel: person.nameTitel,
                    anrede: person.nameAnrede,
                    vorname: person.vorname,
                    familiennamen: person.familienname,
                    initialenfamilienname: person.initialenFamilienname,
                    initialenvorname: person.initialenVorname,
                    rufname: person.rufname,
                    namenspraefix: person.namePraefix,
                    namenssuffix: person.nameSuffix,
                    sortierindex: person.nameSortierindex,
                },
                geburt: {
                    datum: person.geburtsdatum,
                    geburtsort: person.geburtsort,
                },
                stammorganisation: person.stammorganisation,
                geschlecht: person.geschlecht,
                lokalisierung: person.lokalisierung,
                vertrauensstufe: person.vertrauensstufe,
                revision: person.revision,
            },
            personenkontexte: personenkontexte,
            gruppen: [], // TODO: if the gruppe module is implemented, this should be filled out with EW-656 / EW-697
        });

        return response;
    }

    private async mapToPersonenkontextResponse(kontext: Personenkontext<true>): Promise<PersonenkontextResponse> {
        const response: PersonenkontextResponse = await PersonenkontextResponse.construct(kontext);
        return response;
    }
}
