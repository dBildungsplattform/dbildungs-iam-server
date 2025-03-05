import { Controller, Get, UseFilters, Version } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExcludeEndpoint,
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
import { Person } from '../../domain/person.js';
import { PersonInfoResponse } from './person-info.response.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../../shared/error/schulconnex-validation-error.filter.js';
import { PersonApiMapper } from '../../mapper/person-api.mapper.js';
import { AuthenticationExceptionFilter } from '../../../authentication/api/authentication-exception-filter.js';
import { Personenkontext } from '../../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../persistence/person.repository.js';
import { EmailRepo } from '../../../email/persistence/email.repo.js';
import { PersonEmailResponse } from '../person-email-response.js';
import { PersonInfoResponseV1 } from './v1/person-info.response.v1.js';

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
        private readonly emailRepo: EmailRepo,
        private readonly mapper: PersonApiMapper,
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

        const [email, kontexte]: [Option<PersonEmailResponse>, Personenkontext<true>[]] = await Promise.all([
            this.emailRepo.getEmailAddressAndStatusForPerson(person),
            this.dBiamPersonenkontextRepo.findByPerson(personId),
        ]);

        const response: PersonInfoResponse = await this.mapper.mapToPersonInfoResponse(person, kontexte, email);

        return response;
    }

    @Version('1')
    @ApiExcludeEndpoint() //Exclude for now since it has been only created to demonstrate versioning (code blueprint)
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

        const [email, kontexte]: [Option<PersonEmailResponse>, Personenkontext<true>[]] = await Promise.all([
            this.emailRepo.getEmailAddressAndStatusForPerson(person),
            this.dBiamPersonenkontextRepo.findByPerson(personId),
        ]);

        const response: PersonInfoResponseV1 = await this.mapper.mapToPersonInfoResponse(person, kontexte, email);

        return response;
    }
}
