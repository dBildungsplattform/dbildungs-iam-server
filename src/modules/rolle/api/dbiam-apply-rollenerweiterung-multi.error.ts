import { ApiProperty } from '@nestjs/swagger';

export enum DbiamApplyRollenerweiterungMultiErrorI18NTypes {
    ROLLENERWEITERUNG_TECHNICAL_ERROR = 'ROLLENERWEITERUNG_TECHNICAL_ERROR',
}

export type DbiamApplyRollenerweiterungMultiErrorProps = {
    code: number;
    rolleIdsWithI18nKeys: {
        rolleId: string;
        i18nKey: DbiamApplyRollenerweiterungMultiErrorI18NTypes;
    }[];
};

export class DbiamApplyRollenerweiterungMultiError {
    @ApiProperty({ description: 'Corresponds to HTTP Status code like 200, 404, 500' })
    public readonly code!: number;

    @ApiProperty()
    public readonly rolleIdsWithI18nKeys: {
        rolleId: string;
        i18nKey: DbiamApplyRollenerweiterungMultiErrorI18NTypes;
    }[] = [];

    public constructor(props: DbiamApplyRollenerweiterungMultiErrorProps) {
        this.code = props.code;
        this.rolleIdsWithI18nKeys = props.rolleIdsWithI18nKeys;
    }
}
