import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum PersonenkontexteUpdateErrorI18nTypes {
    PERSONENKONTEXTE_UPDATE_ERROR = 'PERSONENKONTEXTE_UPDATE_ERROR',
    PERSONENKONTEXT_NOT_FOUND = 'PERSONENKONTEXT_NOT_FOUND',
    COUNT_MISMATCHING = 'COUNT_MISMATCHING',
    NEWER_VERSION_OF_PERSONENKONTEXTE_AVAILABLE = 'NEWER_VERSION_OF_PERSONENKONTEXTE_AVAILABLE',
    INVALID_LAST_MODIFIED_VALUE = 'INVALID_LAST_MODIFIED_VALUE',
    PERSON_ID_MISMATCH = 'PERSON_ID_MISMATCH',
}
export type DbiamPersonenkontexteUpdateErrorProps = DbiamErrorProps & {
    i18nKey: PersonenkontexteUpdateErrorI18nTypes;
};

export class DbiamPersonenkontexteUpdateError extends DbiamError {
    @ApiProperty({ enum: PersonenkontexteUpdateErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamPersonenkontexteUpdateErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
