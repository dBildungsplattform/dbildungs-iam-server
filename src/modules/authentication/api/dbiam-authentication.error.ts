import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum AuthenticationErrorI18nTypes {
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    KEYCLOAK_USER_NOT_FOUND = 'KEYCLOAK_USER_NOT_FOUND',
}

export type DbiamAuthenticationErrorProps = DbiamErrorProps & {
    i18nKey: AuthenticationErrorI18nTypes;
};

export class DbiamAuthenticationError extends DbiamError {
    @ApiProperty({ enum: AuthenticationErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamAuthenticationErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
