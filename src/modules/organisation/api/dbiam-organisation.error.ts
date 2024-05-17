import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum OrganisationSpecificationErrorI18nTypes {
    ORGANISATION_SPECIFICATION_ERROR = 'ORGANISATION_SPECIFICATION_ERROR',
    KENNUNG_REQUIRED_FOR_SCHULE = 'KENNUNG_REQUIRED_FOR_SCHULE',
    SCHULE_UNTER_TRAEGER = 'SCHULE_UNTER_TRAEGER',
    TRAEGER_IN_TRAEGER = 'TRAEGER_IN_TRAEGER',
    NUR_KLASSE_UNTER_SCHULE = 'NUR_KLASSE_UNTER_SCHULE',
    ZYKLUS_IN_ORGANISATION = 'ZYKLUS_IN_ORGANISATION',
    ROOT_ORGANISATION_IMMUTABLE = 'ROOT_ORGANISATION_IMMUTABLE',
    KLASSE_NUR_VON_SCHULE_ADMINISTRIERT = 'KLASSE_NUR_VON_SCHULE_ADMINISTRIERT',
    KLASSENNAME_AN_SCHULE_EINDEUTIG = 'KLASSENNAME_AN_SCHULE_EINDEUTIG',
}

export type DbiamOrganisationErrorProps = DbiamErrorProps & {
    i18nKey: OrganisationSpecificationErrorI18nTypes;
};

export class DbiamOrganisationError extends DbiamError {
    @ApiProperty({ enum: OrganisationSpecificationErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamOrganisationErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
