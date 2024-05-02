import { Injectable } from '@nestjs/common';
import { Person } from '../domain/person.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonInfoResponse } from '../api/person-info.response.js';
import { Volljaehrig } from '../domain/person.enums.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import {
    Jahrgangsstufe,
    Personenstatus,
    Rolle,
    SichtfreigabeType,
} from '../../personenkontext/domain/personenkontext.enums.js';

@Injectable()
export class PersonApiMapper {
    public toPersonInfoResponse(
        pid: string,
        person: Person<true>,
        kontexte: Personenkontext<true>[],
    ): PersonInfoResponse {
        const response: PersonInfoResponse = new PersonInfoResponse({
            pid: pid,
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
            personenkontexte: kontexte.map((kontext: Personenkontext<true>) => ({
                id: kontext.id,
                referrer: '',
                mandant: '',
                organisation: {} as OrganisationResponse,
                rolle: Rolle.LEHRENDER,
                personenstatus: Personenstatus.AKTIV,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_10,
                sichtfreigabe: SichtfreigabeType.JA,
                loeschung: {
                    zeitpunkt: new Date(),
                },
                revision: '',
            })),
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
}
