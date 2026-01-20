import { Controller, Get, UseFilters, Version } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EntityNotFoundError } from '../../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../../shared/error/schul-connex-error.mapper.js';
import { Permissions } from '../../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { Person } from '../../../person/domain/person.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../../authentication/api/authentication-exception-filter.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../../person/persistence/person.repository.js';
import { PersonEmailResponse } from '../../../person/api/person-email-response.js';
import { PersonInfoResponseV1 } from './v1/person-info.response.v1.js';
import { UserLockRepository } from '../../../keycloak-administration/repository/user-lock.repository.js';
import { UserLock } from '../../../keycloak-administration/domain/user-lock.js';
import { PersonInfoResponse } from './v0/person-info.response.js';
import { EmailResolverService } from '../../../email-microservice/domain/email-resolver.service.js';
import { EmailRepo } from '../../../email/persistence/email.repo.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('person-info')
@Controller({ path: 'person-info' })
export class PersonInfoController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personRepo: PersonRepository,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly userLockRepo: UserLockRepository,
        private readonly emailRepo: EmailRepo,
        private readonly emailResolverService: EmailResolverService,
    ) {
        this.logger.info(`Creating ${PersonInfoController.name}`);
    }

    @Get()
    @ApiOperation({ summary: 'Info about logged in person.' })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the person.', type: PersonInfoResponse })
    public async info(@Permissions() permissions: PersonPermissions): Promise<PersonInfoResponse> {
        const personId: string = permissions.personFields.id;
        const person: Option<Person<true>> = await this.personRepo.findById(personId);

        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError(Person.name, personId)),
            );
        }

        let personEmailResponse: Option<PersonEmailResponse>;
        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            this.logger.info(`Getting PersonEmailResponse for PersonId ${personId} using new Microservice`);
            personEmailResponse = await this.emailResolverService.findEmailBySpshPerson(personId);
        } else {
            this.logger.info(`Getting PersonEmailResponse for PersonId ${personId} using old emailRepo`);
            personEmailResponse = await this.emailRepo.getEmailAddressAndStatusForPerson(person);
        }

        const kontexteWithOrgaAndRolle: Array<KontextWithOrgaAndRolle> = await Promise.resolve(
            this.dBiamPersonenkontextRepo.findByPersonWithOrgaAndRolle(personId),
        );

        return PersonInfoResponse.createNew(person, kontexteWithOrgaAndRolle, personEmailResponse);
    }

    @Version('1')
    @Get()
    @ApiOperation({ summary: 'Info about logged in person.' })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the person.', type: PersonInfoResponseV1 })
    public async infoV1(@Permissions() permissions: PersonPermissions): Promise<PersonInfoResponseV1> {
        const personId: string = permissions.personFields.id;
        const person: Option<Person<true>> = await this.personRepo.findById(personId);

        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError(Person.name, personId)),
            );
        }

        let personEmailResponse: Option<PersonEmailResponse>;
        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            this.logger.info(`Getting PersonEmailResponse for PersonId ${personId} using new Microservice`);
            personEmailResponse = await this.emailResolverService.findEmailBySpshPerson(personId);
        } else {
            this.logger.info(`Getting PersonEmailResponse for PersonId ${personId} using old emailRepo`);
            personEmailResponse = await this.emailRepo.getEmailAddressAndStatusForPerson(person);
        }

        const [kontexteWithOrgaAndRolle, userLocks]: [Array<KontextWithOrgaAndRolle>, UserLock[]] = await Promise.all([
            this.dBiamPersonenkontextRepo.findByPersonWithOrgaAndRolle(personId),
            this.userLockRepo.findByPersonId(personId),
        ]);

        return PersonInfoResponseV1.createNew(person, kontexteWithOrgaAndRolle, personEmailResponse, userLocks);
    }
}
