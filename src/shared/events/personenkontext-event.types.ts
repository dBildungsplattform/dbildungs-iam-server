import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enums.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';
import { OrganisationID, PersonID, RolleID } from '../types/index.js';

export type PersonenkontextEventPersonData = {
    id: PersonID;
    vorname: string;
    familienname: string;
    referrer?: string;
};

export type PersonenkontextEventKontextData = {
    rolleId: RolleID;
    rolle: RollenArt;
    orgaId: OrganisationID;
    orgaTyp?: OrganisationsTyp;
    orgaKennung?: string;
};
