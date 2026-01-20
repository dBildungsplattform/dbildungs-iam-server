export type ExternalSystemIDs = {
    ID_NEXTCLOUD?: string[];
    ID_ITSLEARNING?: string[];
    ID_OX?: string[];
};

export class User<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public username: string,
        public email: string | undefined,
        public createdDate: Persisted<Date, WasPersisted>,
        public externalSystemIDs: ExternalSystemIDs,
        public enabled: boolean,
    ) {}

    public static createNew(
        username: string,
        email: string | undefined,
        externalSystemIDs: ExternalSystemIDs,
    ): User<false> {
        return new User(undefined, username, email, undefined, externalSystemIDs, true);
    }

    public static construct<WasPersisted extends boolean = true>(
        id: string,
        username: string,
        email: string | undefined,
        createdDate: Date,
        externalSystemIDs: ExternalSystemIDs,
        enabled: boolean,
    ): User<WasPersisted> {
        return new User(id, username, email, createdDate, externalSystemIDs, enabled);
    }
}
