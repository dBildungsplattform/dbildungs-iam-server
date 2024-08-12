export class User<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public username: string,
        public email: string | undefined,
        public createdDate: Persisted<Date, WasPersisted>,
        public enabled: boolean,
        public attributes: Record<string, string>,
    ) {}

    public static createNew(username: string, email: string | undefined): User<false> {
        return new User(undefined, username, email, undefined, true, {});
    }

    public static construct<WasPersisted extends boolean = true>(
        id: string,
        username: string,
        email: string | undefined,
        createdDate: Date,
        enabled: boolean,
        attributes: Record<string, string>,
    ): User<WasPersisted> {
        return new User(id, username, email, createdDate, enabled, attributes);
    }
}
