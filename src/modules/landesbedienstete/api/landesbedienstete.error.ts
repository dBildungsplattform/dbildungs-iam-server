import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum LandesbediensteteErrorI18nTypes {
    LANDESBEDIENSTETE_ERROR = 'LANDESBEDIENSTETE_ERROR',
    MISSING_PERMISSIONS = 'MISSING_PERMISSIONS',
    NOT_FOUND = 'NOT_FOUND',
    UPDATE_ERROR = 'UPDATE_ERROR',
}

export type LandesbediensteteErrorProps = DbiamErrorProps & {
    i18nKey: LandesbediensteteErrorI18nTypes;
};

export class LandesbediensteteError extends DbiamError {
    @ApiProperty({ enum: LandesbediensteteErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: LandesbediensteteErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
