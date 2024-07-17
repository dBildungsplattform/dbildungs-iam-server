import { Controller, Get } from '@nestjs/common';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { Public } from '../authentication/api/public.decorator.js';
import { InitSoftwareTokenResponse } from './privacy-idea-api.types.js';

@Controller('pi')
export class PrivacyIdeaAdministrationController {
    public constructor(private readonly privacyIdeaAdministrationService: PrivacyIdeaAdministrationService) {}

    @Get()
    @Public()
    public async initializeSoftwareToken(): Promise<InitSoftwareTokenResponse> {
        return this.privacyIdeaAdministrationService.initializeSoftwareToken();
    }
}
