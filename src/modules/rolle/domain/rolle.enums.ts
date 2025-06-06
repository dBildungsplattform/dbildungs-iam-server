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
}

export enum RollenMerkmal {
    BEFRISTUNG_PFLICHT = 'BEFRISTUNG_PFLICHT',
    KOPERS_PFLICHT = 'KOPERS_PFLICHT',
}

export enum RollenSystemRechtEnum {
    ROLLEN_VERWALTEN = 'ROLLEN_VERWALTEN',
    PERSONEN_SOFORT_LOESCHEN = 'PERSONEN_SOFORT_LOESCHEN', // Implicitly requires PERSONEN_VERWALTEN to be usable in the frontend
    PERSONEN_VERWALTEN = 'PERSONEN_VERWALTEN',
    LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN = 'LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN',
    EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN = 'EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN',
    SCHULEN_VERWALTEN = 'SCHULEN_VERWALTEN',
    KLASSEN_VERWALTEN = 'KLASSEN_VERWALTEN',
    SCHULTRAEGER_VERWALTEN = 'SCHULTRAEGER_VERWALTEN',
    PERSON_SYNCHRONISIEREN = 'PERSON_SYNCHRONISIEREN',
    CRON_DURCHFUEHREN = 'CRON_DURCHFUEHREN',
    PERSONEN_ANLEGEN = 'PERSONEN_ANLEGEN',
    IMPORT_DURCHFUEHREN = 'IMPORT_DURCHFUEHREN', // Requires PERSONEN_VERWALTEN (later PERSONEN_ERSTELLEN !!!) to work
    PERSONEN_LESEN = 'PERSONEN_LESEN',
    BULK_VERWALTEN = 'BULK_VERWALTEN', // For Admins that can do bulk operations like adding personenkontexte to 100 users at once.
    SCHULPORTAL_VERWALTEN = 'SCHULPORTAL_VERWALTEN',
    HINWEISE_BEARBEITEN = 'HINWEISE_BEARBEITEN',
}

// // eslint-disable-next-line @typescript-eslint/typedef
// const ROLLEN_VERWALTEN = 'ROLLEN_VERWALTEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const PERSONEN_SOFORT_LOESCHEN = 'PERSONEN_SOFORT_LOESCHEN'; // Implicitly requires PERSONEN_VERWALTEN to be usable in the frontend
// // eslint-disable-next-line @typescript-eslint/typedef
// const PERSONEN_VERWALTEN = 'PERSONEN_VERWALTEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN = 'LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN = 'EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const SCHULEN_VERWALTEN = 'SCHULEN_VERWALTEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const KLASSEN_VERWALTEN = 'KLASSEN_VERWALTEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const SCHULTRAEGER_VERWALTEN = 'SCHULTRAEGER_VERWALTEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const PERSON_SYNCHRONISIEREN = 'PERSON_SYNCHRONISIEREN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const CRON_DURCHFUEHREN = 'CRON_DURCHFUEHREN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const PERSONEN_ANLEGEN = 'PERSONEN_ANLEGEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const IMPORT_DURCHFUEHREN = 'IMPORT_DURCHFUEHREN'; // Requires PERSONEN_VERWALTEN (later PERSONEN_ERSTELLEN !!!) to work
// // eslint-disable-next-line @typescript-eslint/typedef
// const PERSONEN_LESEN = 'PERSONEN_LESEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const BULK_VERWALTEN = 'BULK_VERWALTEN'; // For Admins that can do bulk operations like adding personenkontexte to 100 users at once.
// // eslint-disable-next-line @typescript-eslint/typedef
// const SCHULPORTAL_VERWALTEN = 'SCHULPORTAL_VERWALTEN';
// // eslint-disable-next-line @typescript-eslint/typedef
// const HINWEISE_BEARBEITEN = 'HINWEISE_BEARBEITEN';

export type RollenSystemRechtNameType =
    | typeof RollenSystemRechtEnum.ROLLEN_VERWALTEN
    | typeof RollenSystemRechtEnum.PERSONEN_SOFORT_LOESCHEN
    | typeof RollenSystemRechtEnum.PERSONEN_VERWALTEN
    | typeof RollenSystemRechtEnum.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN
    | typeof RollenSystemRechtEnum.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN
    | typeof RollenSystemRechtEnum.SCHULEN_VERWALTEN
    | typeof RollenSystemRechtEnum.KLASSEN_VERWALTEN
    | typeof RollenSystemRechtEnum.SCHULTRAEGER_VERWALTEN
    | typeof RollenSystemRechtEnum.PERSON_SYNCHRONISIEREN
    | typeof RollenSystemRechtEnum.CRON_DURCHFUEHREN
    | typeof RollenSystemRechtEnum.PERSONEN_ANLEGEN
    | typeof RollenSystemRechtEnum.IMPORT_DURCHFUEHREN
    | typeof RollenSystemRechtEnum.PERSONEN_LESEN
    | typeof RollenSystemRechtEnum.BULK_VERWALTEN
    | typeof RollenSystemRechtEnum.SCHULPORTAL_VERWALTEN
    | typeof RollenSystemRechtEnum.HINWEISE_BEARBEITEN;

export class RollenSystemRecht {
    private constructor(
        private technicalInternal: boolean,
        private nameInternal: RollenSystemRechtNameType,
    ) {}

    public get technical(): boolean {
        return this.technicalInternal;
    }

    public get name(): RollenSystemRechtNameType {
        return this.nameInternal;
    }

    public static readonly ROLLEN_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.ROLLEN_VERWALTEN,
    );

    // Implicitly requires PERSONEN_VERWALTEN to be usable in the frontend
    public static readonly PERSONEN_SOFORT_LOESCHEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.PERSONEN_SOFORT_LOESCHEN,
    );

    public static readonly PERSONEN_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.PERSONEN_VERWALTEN,
    );

    public static readonly LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN,
    );

    public static readonly EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN,
    );

    public static readonly SCHULEN_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.SCHULEN_VERWALTEN,
    );

    public static readonly KLASSEN_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.KLASSEN_VERWALTEN,
    );

    public static readonly SCHULTRAEGER_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.SCHULTRAEGER_VERWALTEN,
    );

    public static readonly PERSON_SYNCHRONISIEREN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.PERSON_SYNCHRONISIEREN,
    );

    public static readonly CRON_DURCHFUEHREN: RollenSystemRecht = new RollenSystemRecht(
        true,
        RollenSystemRechtEnum.CRON_DURCHFUEHREN,
    );

    public static readonly PERSONEN_ANLEGEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.PERSONEN_ANLEGEN,
    );

    // Requires PERSONEN_VERWALTEN (later PERSONEN_ERSTELLEN !!!) to work
    public static readonly IMPORT_DURCHFUEHREN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.IMPORT_DURCHFUEHREN,
    );

    public static readonly PERSONEN_LESEN: RollenSystemRecht = new RollenSystemRecht(
        true,
        RollenSystemRechtEnum.PERSONEN_LESEN,
    );

    // For Admins that can do bulk operations like adding personenkontexte to 100 users at once.
    public static readonly BULK_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.BULK_VERWALTEN,
    );

    public static readonly SCHULPORTAL_VERWALTEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.SCHULPORTAL_VERWALTEN,
    );

    public static readonly HINWEISE_BEARBEITEN: RollenSystemRecht = new RollenSystemRecht(
        false,
        RollenSystemRechtEnum.HINWEISE_BEARBEITEN,
    );

    public static readonly ALL: RollenSystemRecht[] = [
        RollenSystemRecht.ROLLEN_VERWALTEN,
        RollenSystemRecht.PERSONEN_SOFORT_LOESCHEN,
        RollenSystemRecht.PERSONEN_VERWALTEN,
        RollenSystemRecht.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN,
        RollenSystemRecht.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN,
        RollenSystemRecht.SCHULEN_VERWALTEN,
        RollenSystemRecht.KLASSEN_VERWALTEN,
        RollenSystemRecht.SCHULTRAEGER_VERWALTEN,
        RollenSystemRecht.PERSON_SYNCHRONISIEREN,
        RollenSystemRecht.CRON_DURCHFUEHREN,
        RollenSystemRecht.PERSONEN_ANLEGEN,
        RollenSystemRecht.IMPORT_DURCHFUEHREN,
        RollenSystemRecht.PERSONEN_LESEN,
        RollenSystemRecht.BULK_VERWALTEN,
        RollenSystemRecht.SCHULPORTAL_VERWALTEN,
        RollenSystemRecht.HINWEISE_BEARBEITEN,
    ];

    public static get ALL_NAMES(): RollenSystemRechtNameType[] {
        return RollenSystemRecht.ALL.map((systemrecht: RollenSystemRecht) => systemrecht.name);
    }

    // public static getByStringName(name: string): RollenSystemRecht | undefined {
    //     return RollenSystemRecht.ALL.find(
    //         (systemrecht: RollenSystemRecht) => systemrecht.name === (name as RollenSystemRechtNameType),
    //     );
    // }

    public static getByName(name: RollenSystemRechtNameType): RollenSystemRecht {
        switch (name) {
            case RollenSystemRechtEnum.ROLLEN_VERWALTEN:
                return RollenSystemRecht.ROLLEN_VERWALTEN;
            case RollenSystemRechtEnum.PERSONEN_SOFORT_LOESCHEN:
                return RollenSystemRecht.PERSONEN_SOFORT_LOESCHEN;
            case RollenSystemRechtEnum.PERSONEN_VERWALTEN:
                return RollenSystemRecht.PERSONEN_VERWALTEN;
            case RollenSystemRechtEnum.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN:
                return RollenSystemRecht.LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN;
            case RollenSystemRechtEnum.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN:
                return RollenSystemRecht.EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN;
            case RollenSystemRechtEnum.SCHULEN_VERWALTEN:
                return RollenSystemRecht.SCHULEN_VERWALTEN;
            case RollenSystemRechtEnum.KLASSEN_VERWALTEN:
                return RollenSystemRecht.KLASSEN_VERWALTEN;
            case RollenSystemRechtEnum.SCHULTRAEGER_VERWALTEN:
                return RollenSystemRecht.SCHULTRAEGER_VERWALTEN;
            case RollenSystemRechtEnum.PERSON_SYNCHRONISIEREN:
                return RollenSystemRecht.PERSON_SYNCHRONISIEREN;
            case RollenSystemRechtEnum.CRON_DURCHFUEHREN:
                return RollenSystemRecht.CRON_DURCHFUEHREN;
            case RollenSystemRechtEnum.PERSONEN_ANLEGEN:
                return RollenSystemRecht.PERSONEN_ANLEGEN;
            case RollenSystemRechtEnum.IMPORT_DURCHFUEHREN:
                return RollenSystemRecht.IMPORT_DURCHFUEHREN;
            case RollenSystemRechtEnum.PERSONEN_LESEN:
                return RollenSystemRecht.PERSONEN_LESEN;
            case RollenSystemRechtEnum.BULK_VERWALTEN:
                return RollenSystemRecht.BULK_VERWALTEN;
            case RollenSystemRechtEnum.SCHULPORTAL_VERWALTEN:
                return RollenSystemRecht.SCHULPORTAL_VERWALTEN;
            case RollenSystemRechtEnum.HINWEISE_BEARBEITEN:
                return RollenSystemRecht.HINWEISE_BEARBEITEN;
        }
    }
}
