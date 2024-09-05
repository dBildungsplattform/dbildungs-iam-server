import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enums.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';
import { OrganisationID, PersonenkontextID, PersonID, RolleID } from '../types/index.js';

export type PersonenkontextEventPersonData = {
    id: PersonID;
    vorname: string;
    familienname: string;
    referrer?: string;
    email?: string;
};

export type PersonenkontextEventKontextData = {
    id: PersonenkontextID;

    rolleId: RolleID;
    rolle: RollenArt;
    orgaId: OrganisationID;
    orgaTyp?: OrganisationsTyp;
    orgaKennung?: string;
};