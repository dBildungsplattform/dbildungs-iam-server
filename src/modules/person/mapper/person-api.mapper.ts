import { Injectable } from '@nestjs/common';
import { PersonInfoResponse } from '../api/person-info.response.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';

@Injectable()
export class PersonApiMapper {
    public mapToPersonInfoResponse(person: PersonDo<true>, kontexte: PersonenkontextDo<true>[]): PersonInfoResponse {
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
            personenkontexte: kontexte.map((kontext: PersonenkontextDo<true>) =>
                this.mapToPersonenkontextResponse(kontext),
            ),
            gruppen: [], // TODO: if the gruppe module is implemented, this should be filled out with EW-656 / EW-697
        });

        return response;
    }

    private mapToPersonenkontextResponse(kontext: PersonenkontextDo<true>): PersonenkontextResponse {
        const response: PersonenkontextResponse = PersonenkontextResponse.new({
            id: kontext.id,
            referrer: kontext.referrer,
            mandant: kontext.mandant,
            organisation: {
                id: kontext.organisationId,
            },
            rolle: kontext.rolle,
            personenstatus: kontext.personenstatus,
            jahrgangsstufe: kontext.jahrgangsstufe,
            sichtfreigabe: kontext.sichtfreigabe,
            loeschung: kontext.loeschungZeitpunkt ? { zeitpunkt: kontext.loeschungZeitpunkt } : undefined,
            revision: kontext.revision,
        });

        return response;
    }
}
