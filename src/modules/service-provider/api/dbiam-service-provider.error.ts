import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum ServiceProviderErrorI18nTypes {
    SERVICE_PROVIDER_ERROR = 'SERVICE_PROVIDER_ERROR',
    DUPLICATE_NAME = 'DUPLICATE_NAME',
    ATTACHED_ROLLEN = 'ATTACHED_ROLLEN',
    ATTACHED_ROLLENERWEITERUNGEN = 'ATTACHED_ROLLENERWEITERUNGEN',
}

export type DbiamServiceProviderErrorProps = DbiamErrorProps & {
    i18nKey: ServiceProviderErrorI18nTypes;
};

export class DbiamServiceProviderError extends DbiamError {
    @ApiProperty({ enum: ServiceProviderErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamServiceProviderErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
