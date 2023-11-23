type SchulConnexErrorProps = {
    code: number;
    subcode: string;
    titel: string;
    beschreibung: string;
};

export class SchulConnexError {
    public constructor(props: SchulConnexErrorProps) {
        Object.assign(this, props);
    }

    public readonly code!: number;

    public readonly subcode!: string;

    public readonly titel!: string;

    public readonly beschreibung!: string;
}
