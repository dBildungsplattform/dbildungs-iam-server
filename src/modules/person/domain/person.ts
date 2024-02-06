// eslint-disable-next-line import/extensions
import { Geschlecht, Vertrauensstufe } from './person.enums';

export class Person<WasPersisted extends boolean> {
    private constructor(
        public readonly id: Persisted<string, WasPersisted> | undefined,
        public readonly createdAt: Persisted<Date, WasPersisted> | undefined,
        public readonly updatedAt: Persisted<Date, WasPersisted> | undefined,
        public readonly keycloakUserId: string,
        public readonly mandant: string,
        public readonly familienname: string,
        public readonly vorname: string,
        public readonly revision: string,
        public readonly referrer?: string,
        public readonly stammorganisation?: string,
        public readonly initialenFamilienname?: string,
        public readonly initialenVorname?: string,
        public readonly rufname?: string,
        public readonly nameTitel?: string,
        public readonly nameAnrede?: string[],
        public readonly namePraefix?: string[],
        public readonly nameSuffix?: string[],
        public readonly nameSortierindex?: string,
        public readonly geburtsdatum?: Date,
        public readonly geburtsort?: string,
        public readonly geschlecht?: Geschlecht,
        public readonly lokalisierung?: string,
        public readonly vertrauensstufe?: Vertrauensstufe,
        public readonly auskunftssperre?: boolean,
    ) {}
}
