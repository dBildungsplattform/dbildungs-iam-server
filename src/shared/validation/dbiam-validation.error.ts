import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../error/dbiam.error.js';

export enum ValidationErrorI18nTypes {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    REQUIRED = 'REQUIRED',
    INVALID_LENGTH = 'INVALID_LENGTH',
    INVALID_DATE = 'INVALID_DATE',
    INVALID_ENUM = 'INVALID_ENUM',
}

export type DbiamValidationErrorProps = DbiamErrorProps & {
    i18nKey: ValidationErrorI18nTypes;
};

export class DbiamValidationError extends DbiamError {
    @ApiProperty({ enum: ValidationErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamValidationErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
