import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PersonModule } from '../person/person.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller.js';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { ServiceProviderApiModule } from '../service-provider/service-provider-api.module.js';

@Module({
    imports: [HttpModule, PersonModule, PersonenKontextModule, ServiceProviderApiModule],
    controllers: [PrivacyIdeaAdministrationController],
    providers: [PrivacyIdeaAdministrationService],
})
export class PrivacyIdeaAdministrationModule {}
