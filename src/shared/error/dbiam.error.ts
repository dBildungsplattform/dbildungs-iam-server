import { ApiProperty } from '@nestjs/swagger';

export type DbiamErrorProps = {
    code: number;
    i18nKey: string;
};

export class DbiamError {
    public constructor(props: DbiamErrorProps) {
        Object.assign(this, props);
    }

    @ApiProperty()
    public readonly i18nKey!: string;

    @ApiProperty({ description: 'Corresponds to HTTP Status code like 200, 404, 500' })
    public readonly code!: number;
}
