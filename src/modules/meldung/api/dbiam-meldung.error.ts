import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum MeldungErrorI18nTypes {
    MELDUNG_ERROR = 'MELDUNG_ERROR',
    MELDUNG_INHALT = 'MELDUNG_INHALT',
}

export type DbiamMeldungErrorProps = DbiamErrorProps & {
    i18nKey: MeldungErrorI18nTypes;
};

export class DbiamMeldungError extends DbiamError {
    @ApiProperty({ enum: MeldungErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamMeldungErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
