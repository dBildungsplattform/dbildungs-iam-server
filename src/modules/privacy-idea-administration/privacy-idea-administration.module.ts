import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PersonModule } from '../person/person.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller.js';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';

@Module({
    imports: [HttpModule, PersonModule, PersonenKontextModule, ServiceProviderModule],
    controllers: [PrivacyIdeaAdministrationController],
    providers: [PrivacyIdeaAdministrationService],
})
export class PrivacyIdeaAdministrationModule {}
