import { Geschlecht, Vertrauensstufe } from './person.enums.js';

export type PersonCreationParams = {
    familienname: string;
    vorname: string;
    referrer?: string;
    stammorganisation?: string;
    initialenFamilienname?: string;
    initialenVorname?: string;
    rufname?: string;
    nameTitel?: string;
    nameAnrede?: string[];
    namePraefix?: string[];
    nameSuffix?: string[];
    nameSortierindex?: string;
    geburtsdatum?: Date;
    geburtsort?: string;
    geschlecht?: Geschlecht;
    lokalisierung?: string;
    vertrauensstufe?: Vertrauensstufe;
    auskunftssperre?: boolean;
    username?: string;
    password?: string;
};
