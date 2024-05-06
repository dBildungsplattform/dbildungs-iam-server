import { SchulConnexError, SchulConnexErrorProps } from './schul-connex.error.js';
import { ApiProperty } from '@nestjs/swagger';

export type DbiamErrorProps = SchulConnexErrorProps & { i18nKey: string };

export class DbiamError extends SchulConnexError {
    @ApiProperty()
    public readonly i18nKey: string;

    public constructor(props: DbiamErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
