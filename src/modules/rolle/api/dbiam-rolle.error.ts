import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum RolleErrorI18nTypes {
    ROLLE_ERROR = 'ROLLE_ERROR',
    ADD_SYSTEMRECHT_ERROR = 'ADD_SYSTEMRECHT_ERROR',
    ROLLE_HAT_PERSONENKONTEXTE_ERROR = 'ROLLE_HAT_PERSONENKONTEXTE_ERROR',
    UPDATE_MERKMALE_ERROR = 'UPDATE_MERKMALE_ERROR',
    ROLLENNAME_ENTHAELT_LEERZEICHEN = 'ROLLENNAME_ENTHAELT_LEERZEICHEN',
    NEWER_VERSION_OF_ROLLE_AVAILABLE = 'NEWER_VERSION_OF_ROLLE_AVAILABLE',
}

export type DbiamRolleErrorProps = DbiamErrorProps & {
    i18nKey: RolleErrorI18nTypes;
};

export class DbiamRolleError extends DbiamError {
    @ApiProperty({ enum: RolleErrorI18nTypes })
    public override readonly i18nKey: string;

    public constructor(props: DbiamRolleErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
