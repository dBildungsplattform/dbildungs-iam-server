import { ApiProperty } from '@nestjs/swagger';

export type DbiamErrorProps = {
    code: number;
    titel: string;
    beschreibung: string;
};

export class DbiamError {
    public constructor(props: DbiamErrorProps) {
        Object.assign(this, props);
    }

    @ApiProperty({ description: 'Corresponds to HTTP Status code like 200, 404, 500' })
    public readonly code!: number;

    @ApiProperty()
    public readonly titel!: string;

    @ApiProperty()
    public readonly beschreibung!: string;
}
