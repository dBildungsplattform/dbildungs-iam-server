import { BaseEvent } from './base-event.js';

import { type Organisation } from '../../modules/organisation/domain/organisation.js';
import { type Person } from '../../modules/person/domain/person.js';
import { type Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { type Rolle } from '../../modules/rolle/domain/rolle.js';
import { PersonenkontextEventKontextData, PersonenkontextEventPersonData } from './personenkontext-event.types.js';

export type PersonenkontextUpdatedPersonData = PersonenkontextEventPersonData;

export type PersonenkontextUpdatedData = PersonenkontextEventKontextData;

function mapPersonToData(person: Person<true>): PersonenkontextUpdatedPersonData {
    return {
        id: person.id,
        vorname: person.vorname,
        familienname: person.familienname,
        referrer: person.referrer,
        email: person.email,
    };
}

function mapPersonenkontextAndRolleAggregateToData([pk, orga, rolle]: [
    Personenkontext<true>,
    Organisation<true>,
    Rolle<true>,
]): PersonenkontextEventKontextData {
    return {
        id: pk.id,
        rolleId: pk.rolleId,
        rolle: rolle.rollenart,
        orgaId: pk.organisationId,
        orgaTyp: orga.typ,
        orgaKennung: orga.kennung,
    };
}

export class PersonenkontextUpdatedEvent extends BaseEvent {
    public constructor(
        public readonly person: PersonenkontextEventPersonData,
        public readonly newKontexte: PersonenkontextEventKontextData[],
        public readonly removedKontexte: PersonenkontextEventKontextData[],
        public readonly currentKontexte: PersonenkontextEventKontextData[],
    ) {
        super();
    }

    public static fromPersonenkontexte(
        person: Person<true>,
        newKontexte: [Personenkontext<true>, Organisation<true>, Rolle<true>][],
        removedKontexte: [Personenkontext<true>, Organisation<true>, Rolle<true>][],
        currentKontexte: [Personenkontext<true>, Organisation<true>, Rolle<true>][],
    ): PersonenkontextUpdatedEvent {
        return new PersonenkontextUpdatedEvent(
            mapPersonToData(person),
            newKontexte.map(mapPersonenkontextAndRolleAggregateToData),
            removedKontexte.map(mapPersonenkontextAndRolleAggregateToData),
            currentKontexte.map(mapPersonenkontextAndRolleAggregateToData),
        );
    }
}
