import { Module } from '@nestjs/common';
import { UsernameGeneratorService } from './username-generator.service.js';
import { UserRepository } from './user.repository.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';

@Module({ providers: [UsernameGeneratorService, UserRepository], imports: [KeycloakAdministrationModule] })
export class UserModule {}
