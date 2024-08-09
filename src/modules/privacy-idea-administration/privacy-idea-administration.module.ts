import { Module } from '@nestjs/common';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { PrivacyIdeaAdministrationController } from './privacy-idea-administration.controller.js';
import { HttpModule } from '@nestjs/axios';
import { PersonModule } from '../person/person.module.js';

@Module({
    imports: [HttpModule, PersonModule],
    controllers: [PrivacyIdeaAdministrationController],
    providers: [PrivacyIdeaAdministrationService],
})
export class PrivacyIdeaAdministrationModule {}
