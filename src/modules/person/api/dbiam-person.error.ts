import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum PersonErrorI18nTypes {
    PERSON_ERROR = 'PERSON_ERROR',
    VORNAME_ENTHAELT_LEERZEICHEN = 'VORNAME_ENTHAELT_LEERZEICHEN',
    FAMILIENNAME_ENTHAELT_LEERZEICHEN = 'FAMILIENNAME_ENTHAELT_LEERZEICHEN',
    PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
    DOWNSTREAM_UNREACHABLE = 'DOWNSTREAM_UNREACHABLE',
    PERSONALNUMMER_REQUIRED = 'PERSONALNUMMER_REQUIRED',
    NEWER_VERSION_OF_PERSON_AVAILABLE = 'NEWER_VERSION_OF_PERSON_AVAILABLE',
    PERSONALNUMMER_NICHT_EINDEUTIG = 'PERSONALNUMMER_NICHT_EINDEUTIG',
    PERSON_UEM_PASSWORD_MODIFICATION_ERROR = 'PERSON_UEM_PASSWORD_MODIFICATION_ERROR',
    LANDESBEDIENSTETER_SEARCH_NO_PERSON_FOUND = 'LANDESBEDIENSTETER_SEARCH_NO_PERSON_FOUND',
    LANDESBEDIENSTETER_SEARCH_MULTIPLE_PERSONS_FOUND = 'LANDESBEDIENSTETER_SEARCH_MULTIPLE_PERSONS_FOUND',
}

export type DbiamPersonErrorProps = DbiamErrorProps & {
    i18nKey: PersonErrorI18nTypes;
};

export class DbiamPersonError extends DbiamError {
    @ApiProperty({ enum: PersonErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamPersonErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
