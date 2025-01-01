import { IsBooleanString, IsNotEmpty } from 'class-validator';

export class FeatureFlagConfig {
    @IsBooleanString()
    @IsNotEmpty()
    public readonly FEATURE_FLAG_ROLLE_BEARBEITEN!: 'true' | 'false';

    @IsBooleanString()
    @IsNotEmpty()
    public readonly FEATURE_FLAG_BEFRISTUNG_BEARBEITEN!: 'true' | 'false';
}
