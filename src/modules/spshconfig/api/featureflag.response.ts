import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlagConfig } from '../../../shared/config/index.js';

export class FeatureFlagResponse {
    @ApiProperty()
    public rolleBearbeitenEnabled: boolean;

    @ApiProperty()
    public befristungBearbeitenEnabled: boolean;

    public constructor(featureFlagConfig: FeatureFlagConfig) {
        this.rolleBearbeitenEnabled = this.toBoolean(featureFlagConfig.FEATURE_FLAG_ROLLE_BEARBEITEN);
        this.befristungBearbeitenEnabled = this.toBoolean(featureFlagConfig.FEATURE_FLAG_BEFRISTUNG_BEARBEITEN);
    }

    private toBoolean(value: string): boolean {
        //Auto defaults to false for everything which is not 'true'
        return value === 'true';
    }
}
