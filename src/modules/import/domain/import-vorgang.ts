import { ImportStatus } from './import.enums.js';

export class ImportVorgang<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public importByUsername: string,
        public rollename: string,
        public organisationsname: string,
        public dataItemCount: number,
        public status: ImportStatus | undefined,
        public importByPersonId?: string,
        public rolleId?: string,
        public organisationId?: string,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        importByUsername: string,
        rollename: string,
        organisationsname: string,
        dataItemCount: number,
        status: ImportStatus,
        importByPersonId?: string,
        rolleId?: string,
        organisationId?: string,
    ): ImportVorgang<WasPersisted> {
        return new ImportVorgang(
            id,
            createdAt,
            updatedAt,
            importByUsername,
            rollename,
            organisationsname,
            dataItemCount,
            status,
            importByPersonId,
            rolleId,
            organisationId,
        );
    }

    public static createNew(
        importByUsername: string,
        rollename: string,
        organisationsname: string,
        dataItemCount: number,
        importByPersonId?: string,
        rolleId?: string,
        organisationId?: string,
    ): ImportVorgang<false> {
        return new ImportVorgang(
            undefined,
            undefined,
            undefined,
            importByUsername,
            rollename,
            organisationsname,
            dataItemCount,
            undefined,
            importByPersonId,
            rolleId,
            organisationId,
        );
    }

    public validate(invalidImportDataItems: number): void {
        this.status = invalidImportDataItems > 0 ? ImportStatus.INVALID : ImportStatus.VALID;
    }

    public execute(): void {
        this.status = ImportStatus.INPROGRESS;
    }

    public fail(): void {
        this.status = ImportStatus.FAILED;
    }

    public complete(): void {
        this.status = ImportStatus.COMPLETED;
    }

    public cancel(): void {
        this.status = ImportStatus.CANCELLED;
    }
}
