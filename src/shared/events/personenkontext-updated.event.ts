import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enums.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';
import { OrganisationID, PersonID, RolleID } from '../types/index.js';
import { BaseEvent } from './base-event.js';

import { type Organisation } from '../../modules/organisation/domain/organisation.js';
import { type Person } from '../../modules/person/domain/person.js';
import { type Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { type Rolle } from '../../modules/rolle/domain/rolle.js';

export type PersonenkontextUpdatedPersonData = {
    id: PersonID;
    vorname: string;
    familienname: string;
};

export type PersonenkontextUpdatedData = {
    rolleId: RolleID;
    rolle: RollenArt;
    orgaId: OrganisationID;
    orgaTyp?: OrganisationsTyp;
};

function mapPersonToData(person: Person<true>): PersonenkontextUpdatedPersonData {
    return {
        id: person.id,
        vorname: person.vorname,
        familienname: person.familienname,
    };
}

function mapPersonenkontextAndRolleAggregateToData([pk, orga, rolle]: [
    Personenkontext<true>,
    Organisation<true>,
    Rolle<true>,
]): PersonenkontextUpdatedData {
    return {
        rolleId: pk.rolleId,
        rolle: rolle.rollenart,
        orgaId: pk.organisationId,
        orgaTyp: orga.typ,
    };
}

export class PersonenkontextUpdatedEvent extends BaseEvent {
    public constructor(
        public readonly person: PersonenkontextUpdatedPersonData,
        public readonly newKontexte: PersonenkontextUpdatedData[],
        public readonly removedKontexte: PersonenkontextUpdatedData[],
        public readonly currentKontexte: PersonenkontextUpdatedData[],
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
