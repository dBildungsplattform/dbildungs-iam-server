import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum VidisErrorI18nTypes {
    VIDIS_API_ERROR = 'VIDIS_API_ERROR',
    VIDIS_ERROR = 'VIDIS_ERROR',
}

export type VidisErrorProps = DbiamErrorProps & {
    i18nKey: VidisErrorI18nTypes;
};

export class VidisError extends DbiamError {
    @ApiProperty({ enum: VidisErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: VidisErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
