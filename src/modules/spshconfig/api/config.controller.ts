import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FeatureFlagConfig } from '../../../shared/config/index.js';
import { Public } from '../../authentication/api/public.decorator.js';
import { FeatureFlagResponse } from './featureflag.response.js';

const FEATUREFLAG_CONFIG_KEY: string = 'FEATUREFLAG';

@Controller({ path: 'config' })
@ApiTags('config')
export class ConfigController {
    public constructor(private readonly configService: ConfigService) {}

    @Get()
    @Public()
    @ApiOkResponse({ description: 'The feature flag config was successfully returned.', type: FeatureFlagResponse })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the config.' })
    public getFeatureFlags(): FeatureFlagResponse {
        const featureFlagConfig: FeatureFlagConfig =
            this.configService.getOrThrow<FeatureFlagConfig>(FEATUREFLAG_CONFIG_KEY);
        return new FeatureFlagResponse(featureFlagConfig);
    }
}
