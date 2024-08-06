export class TokenError extends Error {
    public constructor(
        public override message: string,
        name: string,
    ) {
        super(message);
        this.name = name;
    }
}
