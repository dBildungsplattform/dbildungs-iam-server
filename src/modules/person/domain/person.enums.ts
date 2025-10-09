export const VertrauensstufeTypName: string = 'Vertrauensstufe';
export const GeschlechtTypName: string = 'Geschlecht';
export const PersonLockOccasionTypName: string = 'PersonLockOccasion';
export const SortFieldPersonTypName: string = 'SortFieldPerson';

export enum SortFieldPerson {
    FAMILIENNAME = 'familienname',
    VORNAME = 'vorname',
    PERSONALNUMMER = 'personalnummer',
    REFERRER = 'referrer',
}

export enum PersonLockOccasion {
    KOPERS_GESPERRT = 'KOPERS_GESPERRT',
    MANUELL_GESPERRT = 'MANUELL_GESPERRT',
}

export enum PersonExternalIdType {
    LDAP = 'LDAP',
}
