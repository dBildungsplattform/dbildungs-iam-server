import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum RollenerweiterungErrorI18nTypes {
    ROLLENERWEITERUNG_ERROR = 'ROLLENERWEITERUNG_ERROR',
    MISSING_MERKMAL_VERFUEGBAR_FUER_ROLLENERWEITERUNG_ERROR = 'MISSING_MERKMAL_VERFUEGBAR_FUER_ROLLENERWEITERUNG_ERROR',
}

export type DbiamRollenerweiterungErrorProps = DbiamErrorProps & {
    i18nKey: RollenerweiterungErrorI18nTypes;
};

export class DbiamRollenerweiterungError extends DbiamError {
    @ApiProperty({ enum: RollenerweiterungErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamRollenerweiterungErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
