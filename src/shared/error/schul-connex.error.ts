import { ApiProperty } from '@nestjs/swagger';

export type SchulConnexErrorProps = {
    code: number;
    subcode: string;
    titel: string;
    beschreibung: string;
};

export class SchulConnexError {
    public constructor(props: SchulConnexErrorProps) {
        Object.assign(this, props);
    }

    @ApiProperty({ description: 'Corresponds to HTTP Status code like 200, 404, 500' })
    public readonly code!: number;

    @ApiProperty()
    public readonly subcode!: string;

    @ApiProperty()
    public readonly titel!: string;

    @ApiProperty()
    public readonly beschreibung!: string;
}
