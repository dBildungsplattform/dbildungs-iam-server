import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum PersonenkontextSpecificationErrorI18nTypes {
    PERSONENKONTEXT_SPECIFICATION_ERROR = 'PERSONENKONTEXT_SPECIFICATION_ERROR',
    NUR_LEHR_UND_LERN_AN_KLASSE = 'NUR_LEHR_UND_LERN_AN_KLASSE',
    GLEICHE_ROLLE_AN_KLASSE_WIE_SCHULE = 'GLEICHE_ROLLE_AN_KLASSE_WIE_SCHULE',
    ORGANISATION_MATCHES_ROLLENART = 'ORGANISATION_MATCHES_ROLLENART',
    PERSONENKONTEXT_ANLAGE_ERROR = 'PERSONENKONTEXT_ANLAGE_ERROR',
}
export type DbiamPersonenkontextErrorProps = DbiamErrorProps & {
    i18nKey: PersonenkontextSpecificationErrorI18nTypes;
};

export class DbiamPersonenkontextError extends DbiamError {
    @ApiProperty({ enum: PersonenkontextSpecificationErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamPersonenkontextErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
