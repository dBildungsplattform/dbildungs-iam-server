import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlagConfig } from '../../../shared/config/index.js';

export class FeatureFlagResponse {
    @ApiProperty()
    public rolleBearbeitenEnabled: boolean;

    @ApiProperty()
    public befristungBearbeitenEnabled: boolean;

    @ApiProperty()
    public rolleErweiternEnabled: boolean;

    @ApiProperty()
    public setUemPasswordEnabled: boolean;

    public constructor(featureFlagConfig: FeatureFlagConfig) {
        this.rolleBearbeitenEnabled = featureFlagConfig.FEATURE_FLAG_ROLLE_BEARBEITEN;
        this.befristungBearbeitenEnabled = featureFlagConfig.FEATURE_FLAG_BEFRISTUNG_BEARBEITEN;
        this.rolleErweiternEnabled = featureFlagConfig.FEATURE_FLAG_ROLLE_ERWEITERN;
        this.setUemPasswordEnabled = featureFlagConfig.FEATURE_FLAG_SET_UEM_PASSWORD;
    }
}
