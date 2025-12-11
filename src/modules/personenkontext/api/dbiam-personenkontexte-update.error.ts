import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum PersonenkontexteUpdateErrorI18nTypes {
    PERSONENKONTEXTE_UPDATE_ERROR = 'PERSONENKONTEXTE_UPDATE_ERROR',
    PERSONENKONTEXT_NOT_FOUND = 'PERSONENKONTEXT_NOT_FOUND',
    COUNT_MISMATCHING = 'COUNT_MISMATCHING',
    NEWER_VERSION_OF_PERSONENKONTEXTE_AVAILABLE = 'NEWER_VERSION_OF_PERSONENKONTEXTE_AVAILABLE',
    INVALID_LAST_MODIFIED_VALUE = 'INVALID_LAST_MODIFIED_VALUE',
    PERSON_ID_MISMATCH = 'PERSON_ID_MISMATCH',
    PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
    INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN = 'INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN',
    BEFRISTUNG_REQUIRED_FOR_PERSONENKONTEXT = ' BEFRISTUNG_REQUIRED_FOR_PERSONENKONTEXT',
    DUPLICATE_KLASSENKONTEXT_FOR_SAME_ROLLE = 'DUPLICATE_KLASSENKONTEXT_FOR_SAME_ROLLE',
    LERN_NOT_AT_SCHULE_AND_KLASSE = 'LERN_NOT_AT_SCHULE_AND_KLASSE',
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
