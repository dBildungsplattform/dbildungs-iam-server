import { Controller, Get, UseFilters, Version } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EntityNotFoundError } from '../../../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../../../shared/error/schul-connex-error.mapper.js';
import { Permissions } from '../../../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../../../authentication/domain/person-permissions.js';
import { Person } from '../../../domain/person.js';
import { PersonInfoResponse } from './v0/person-info.response.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../../../authentication/api/authentication-exception-filter.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../../persistence/person.repository.js';
import { EmailRepo } from '../../../../email/persistence/email.repo.js';
import { PersonEmailResponse } from '../../person-email-response.js';
import { PersonInfoResponseV1 } from './v1/person-info.response.v1.js';
import { UserLockRepository } from '../../../../keycloak-administration/repository/user-lock.repository.js';
import { UserLock } from '../../../../keycloak-administration/domain/user-lock.js';

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

        const [email, kontexteWithOrgaAndRolle]: [Option<PersonEmailResponse>, Array<KontextWithOrgaAndRolle>] =
            await Promise.all([
                this.emailRepo.getEmailAddressAndStatusForPerson(person),
                this.dBiamPersonenkontextRepo.findByPersonWithOrgaAndRolle(personId),
            ]);

        return PersonInfoResponse.createNew(person, kontexteWithOrgaAndRolle, email);
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

        const [email, kontexteWithOrgaAndRolle, userLocks]: [
            Option<PersonEmailResponse>,
            Array<KontextWithOrgaAndRolle>,
            UserLock[],
        ] = await Promise.all([
            this.emailRepo.getEmailAddressAndStatusForPerson(person),
            this.dBiamPersonenkontextRepo.findByPersonWithOrgaAndRolle(personId),
            this.userLockRepo.findByPersonId(personId),
        ]);

        return PersonInfoResponseV1.createNew(person, kontexteWithOrgaAndRolle, email, userLocks);
    }
}
