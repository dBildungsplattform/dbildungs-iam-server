import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { EmailModule } from '../email/email.module.js';
import { PersonenInfoController } from './api/personeninfo/personeninfo.controller.js';
import { PersonInfoController } from './api/personinfo/person-info.controller.js';
import { PersonenInfoService } from './domain/personeninfo/personeninfo.service.js';
import { PersonModule } from '../person/person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { SchulconnexRepo } from './persistence/schulconnex.repo.js';
import { EntityAggregateMapper } from '../person/mapper/entity-aggregate.mapper.js';
import { EmailMicroserviceModule } from '../email-microservice/email-microservice.module.js';
import { SchulConnexValidationErrorFilter } from './error/schulconnex-validation-error.filter.js';
import { SchulConnexSharedErrorFilter } from './error/schulconnex-shared-error-filter.js';
import { SchulConnexAuthenticationDomainErrorFilter } from './error/schulconnex-authentication-domain-error-filter.js';
import { APP_FILTER } from '@nestjs/core';
import { SharedExceptionFilter } from '../../shared/filter/shared-exception-filter.js';
import { ValidationExceptionFilter } from '../../shared/filter/validation-exception-filter.js';
import { AuthenticationExceptionFilter } from '../authentication/api/authentication-exception-filter.js';

@Module({
    imports: [
        PersonModule,
        EmailModule,
        RolleModule,
        OrganisationModule,
        PersonenKontextModule,
        KeycloakAdministrationModule,
        EmailMicroserviceModule,
        LoggerModule.register(SchulconnexModule.name),
    ],
    providers: [
        PersonenInfoService,
        SchulconnexRepo,
        EntityAggregateMapper,
        SchulConnexValidationErrorFilter,
        SchulConnexSharedErrorFilter,
        SchulConnexAuthenticationDomainErrorFilter,
        { provide: APP_FILTER, useClass: ValidationExceptionFilter },
        { provide: APP_FILTER, useClass: AuthenticationExceptionFilter },
        { provide: APP_FILTER, useClass: SharedExceptionFilter },
    ],
    controllers: [PersonInfoController, PersonenInfoController],
})
export class SchulconnexModule {}
