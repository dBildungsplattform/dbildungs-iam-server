import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';

export class ImportDataItem<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public familienname: string,
        public vorname: string,
        public readonly organisationId: OrganisationID,
        public readonly rolleId: RolleID,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: Persisted<string, WasPersisted>,
        createdAt: Persisted<Date, WasPersisted>,
        updatedAt: Persisted<Date, WasPersisted>,
        familienname: string,
        vorname: string,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): ImportDataItem<WasPersisted> {
        return new ImportDataItem(id, createdAt, updatedAt, familienname, vorname, organisationId, rolleId);
    }

    public static createNew(
        familienname: string,
        vorname: string,
        organisationId: OrganisationID,
        rolleId: RolleID,
    ): ImportDataItem<false> {
        return new ImportDataItem(undefined, undefined, undefined, familienname, vorname, organisationId, rolleId);
    }
}
