import { Injectable } from '@nestjs/common';
import { PersonInfoResponse } from '../api/person-info.response.js';
import { Volljaehrig } from '../domain/person.enums.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
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
            gruppen: [], // TODO: if the gruppe module is implemented, this should be filled out
        });

        return response;
    }

    public isPersonVolljaehrig(birthDate: Date | undefined, now: Date): Volljaehrig {
        const msPerYear: number = 1000 * 60 * 60 * 24 * 365.25;

        if (!birthDate) {
            return Volljaehrig.NEIN;
        }

        const ageInMs: number = now.getTime() - birthDate.getTime();
        const result: Volljaehrig = ageInMs >= msPerYear * 18 ? Volljaehrig.JA : Volljaehrig.NEIN;

        return result;
    }

    private mapToPersonenkontextResponse(kontext: PersonenkontextDo<true>): PersonenkontextResponse {
        const response: PersonenkontextResponse = new PersonenkontextResponse({
            id: kontext.id,
            referrer: kontext.referrer,
            mandant: kontext.mandant,
            organisation: {
                id: kontext.organisation.id,
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
