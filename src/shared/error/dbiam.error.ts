import { SchulConnexError, SchulConnexErrorProps } from './schul-connex.error.js';
import { ApiProperty } from '@nestjs/swagger';

type DbiamErrorProps = SchulConnexErrorProps & { i18n: string };

export class DbiamError extends SchulConnexError {
    @ApiProperty()
    public readonly i18n: string;

    public constructor(props: DbiamErrorProps) {
        super(props);
        this.i18n = props.i18n;
    }
}
