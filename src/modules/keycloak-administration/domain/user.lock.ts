export class UserLock<WasPersisted extends boolean> {
    private constructor(
        public personId: Persisted<string, WasPersisted>,
        public locked_by: string,
        public locked_until: Date | undefined,
    ) {}

    public static construct<WasPersisted extends boolean = true>(
        personId: string,
        locked_by: string,
        locked_until: Date | undefined,
    ): UserLock<WasPersisted> {
        return new UserLock(personId, locked_by, locked_until);
    }
}
