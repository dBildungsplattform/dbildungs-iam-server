import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from './dbiam.error.js';

export enum SharedErrorI18nTypes {
    NOT_FOUND = 'NOT_FOUND',
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    CONFLICT = 'CONFLICT',
    INVALID_STATE = 'INVALID_STATE',
    LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
    INTERNAL = 'INTERNAL',
}

export type DbiamSharedErrorProps = DbiamErrorProps & {
    i18nKey: SharedErrorI18nTypes;
};

export class DbiamSharedError extends DbiamError {
    @ApiProperty({ enum: SharedErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamSharedErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
