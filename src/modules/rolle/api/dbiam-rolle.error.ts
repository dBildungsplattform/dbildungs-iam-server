import { ApiProperty } from '@nestjs/swagger';
import { DbiamError, DbiamErrorProps } from '../../../shared/error/dbiam.error.js';

export enum RolleErrorI18nTypes {
    ROLLE_ERROR = 'ROLLE_ERROR',
    ADD_SYSTEM_RECHT_ERROR = 'ADD_SYSTEM_RECHT_ERROR',
}

export type DbiamRolleErrorProps = DbiamErrorProps & {
    i18nKey: RolleErrorI18nTypes;
};

export class DbiamRolleError extends DbiamError {
    @ApiProperty({ enum: RolleErrorI18nTypes })
    public readonly i18nKey: string;

    public constructor(props: DbiamRolleErrorProps) {
        super(props);
        this.i18nKey = props.i18nKey;
    }
}
