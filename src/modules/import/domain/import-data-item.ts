export class ImportDataItem<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public importvorgangId: string,
        public familienname: string,
        public vorname: string,
        public organisation?: string,
        public personalnummer?: string,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        importvorgangId: string,
        familienname: string,
        vorname: string,
        organisation?: string,
        personalnummer?: string,
    ): ImportDataItem<WasPersisted> {
        return new ImportDataItem(
            id,
            createdAt,
            updatedAt,
            importvorgangId,
            familienname,
            vorname,
            organisation,
            personalnummer,
        );
    }

    public static createNew(
        importvorgangId: string,
        familienname: string,
        vorname: string,
        organisation?: string,
        personalnummer?: string,
    ): ImportDataItem<false> {
        return new ImportDataItem(
            undefined,
            undefined,
            undefined,
            importvorgangId,
            familienname,
            vorname,
            organisation,
            personalnummer,
        );
    }
}
