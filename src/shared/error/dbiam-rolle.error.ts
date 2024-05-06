import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from './dbiam.error.js';

export class DbiamRolleError extends DbiamError {
    @ApiProperty({ examples: ['NUR_LEHR_UND_LERN_AN_KLASSE', 'GLEICHE_ROLLE_AN_KLASSE_WIE_SCHULE'] })
    public override readonly i18nKey: string;

    public constructor(props: DbiamErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
