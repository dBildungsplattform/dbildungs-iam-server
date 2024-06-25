// Assuming the existence of a UserRepository and relevant domain logic

export class UserDo<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public username: string,
        public email: string | undefined,
        public createdDate: Persisted<Date, WasPersisted>,
    ) {}

    public static createNew(username: string, email: string | undefined): UserDo<false> {
        return new UserDo(undefined, username, email, undefined);
    }

    public static construct<WasPersisted extends boolean = true>(
        id: string,
        username: string,
        email: string | undefined,
        createdDate: Date,
    ): UserDo<WasPersisted> {
        return new UserDo(id, username, email, createdDate);
    }
}
