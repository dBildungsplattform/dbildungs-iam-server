import { Jahrgangsstufe, Personenstatus, SichtfreigabeType } from './personenkontext.enums.js';

export class Personenkontext<WasPersisted extends boolean> {
    private constructor(
        public readonly id: Persisted<string, WasPersisted>,
        public readonly createdAt: Persisted<Date, WasPersisted>,
        public readonly updatedAt: Persisted<Date, WasPersisted>,
        public readonly personId: string,
        public readonly organisationId: string,
        public readonly rolleId: string,
        public referrer: string | undefined,
        // TODO EW-636: mandant is related to organizations so it is not set for now. When implemented should be set to nullable: false
        public mandant: string | undefined,
        public personenstatus: Personenstatus | undefined,
        public jahrgangsstufe: Jahrgangsstufe | undefined,
        public sichtfreigabe: SichtfreigabeType | undefined,
        public loeschungZeitpunkt: Date | undefined,
        public revision: string,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        personId: string,
        organisationId: string,
        rolleId: string,
        referrer: string | undefined,
        // TODO EW-636: mandant is related to organizations so it is not set for now. When implemented should be set to nullable: false
        mandant: string | undefined,
        personenstatus: Personenstatus | undefined,
        jahrgangsstufe: Jahrgangsstufe | undefined,
        sichtfreigabe: SichtfreigabeType | undefined,
        loeschungZeitpunkt: Date | undefined,
        revision: string,
    ): Personenkontext<WasPersisted> {
        return new Personenkontext(
            id,
            createdAt,
            updatedAt,
            personId,
            organisationId,
            rolleId,
            referrer,
            mandant,
            personenstatus,
            jahrgangsstufe,
            sichtfreigabe,
            loeschungZeitpunkt,
            revision,
        );
    }
}
