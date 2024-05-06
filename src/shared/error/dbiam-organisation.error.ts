import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from './dbiam.error.js';

export class DbiamOrganisationError extends DbiamError {
    @ApiProperty({
        examples: [
            'SCHULE_UNTER_TRAEGER',
            'TRAEGER_IN_TRAEGER',
            'NUR_KLASSE_UNTER_SCHULE',
            'ZYKLUS_IN_ORGANISATION',
            'ROOT_ORGANISATION_IMMUTABLE',
            'KLASSE_NUR_VON_SCHULE_ADMINISTRIERT',
            'KLASSEN_NAME_AN_SCHULE_EINDEUTIG',
        ],
    })
    public override readonly i18nKey: string;

    public constructor(props: DbiamErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
