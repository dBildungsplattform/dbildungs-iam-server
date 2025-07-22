export const RollenArtTypName: string = 'RollenArt';
export const RollenMerkmalTypName: string = 'RollenMerkmal';
export const RollenSystemRechtTypName: string = 'RollenSystemRecht';

export enum RollenArt {
    LERN = 'LERN',
    LEHR = 'LEHR',
    EXTERN = 'EXTERN',
    ORGADMIN = 'ORGADMIN',
    LEIT = 'LEIT',
    SYSADMIN = 'SYSADMIN',
    PORTALADMIN = 'PORTALADMIN',
}

export enum RollenMerkmal {
    BEFRISTUNG_PFLICHT = 'BEFRISTUNG_PFLICHT',
    KOPERS_PFLICHT = 'KOPERS_PFLICHT',
    MAPPING = 'MAPPING',
}

export enum RollenSystemRecht {
    ROLLEN_VERWALTEN = 'ROLLEN_VERWALTEN',
    PERSONEN_SOFORT_LOESCHEN = 'PERSONEN_SOFORT_LOESCHEN', // Implicitly requires PERSONEN_VERWALTEN to be usable in the frontend
    PERSONEN_VERWALTEN = 'PERSONEN_VERWALTEN',
    SCHULEN_VERWALTEN = 'SCHULEN_VERWALTEN',
    KLASSEN_VERWALTEN = 'KLASSEN_VERWALTEN',
    SCHULTRAEGER_VERWALTEN = 'SCHULTRAEGER_VERWALTEN',
    MIGRATION_DURCHFUEHREN = 'MIGRATION_DURCHFUEHREN',
    PERSON_SYNCHRONISIEREN = 'PERSON_SYNCHRONISIEREN',
    CRON_DURCHFUEHREN = 'CRON_DURCHFUEHREN',
    PERSONEN_ANLEGEN = 'PERSONEN_ANLEGEN',
    IMPORT_DURCHFUEHREN = 'IMPORT_DURCHFUEHREN', // Requires PERSONEN_VERWALTEN (later PERSONEN_ERSTELLEN !!!) to work
    PERSONEN_LESEN = 'PERSONEN_LESEN',
    BULK_VERWALTEN = 'BULK_VERWALTEN', // For Admins that can do bulk operations like adding personenkontexte to 100 users at once.
    SCHULPORTAL_VERWALTEN = 'SCHULPORTAL_VERWALTEN',
    HINWEISE_BEARBEITEN = 'HINWEISE_BEARBEITEN',
}

export enum SchulcloudRollenArt {
    USER = 'user',
    STUDENT = 'student',
    TEACHER = 'teacher',
    ADMIN = 'admin',
    SUPERHERO = 'superhero',
}

export enum MoodleRollenArt {
    AUTHENTICATED = 'Authenticated',
    USER = 'User',
    STUDENT = 'Student',
    TEACHER = 'Teacher',
    MANAGER = 'Manager',
    SITE_ADMINISTRATOR = 'Site administrator',
}
