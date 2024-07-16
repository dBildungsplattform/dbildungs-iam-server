import { Controller, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Person } from '../domain/person.js';
import { PersonInfoResponse } from './person-info.response.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { PersonApiMapper } from '../mapper/person-api.mapper.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextScope } from '../../personenkontext/persistence/personenkontext.scope.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('person-info')
@Controller({ path: 'person-info' })
export class PersonInfoController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personRepo: PersonRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
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
        const person: Option<PersonDo<true>> = await this.personRepo.findById(personId);

        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError(Person.name, personId)),
            );
        }

        const scope: PersonenkontextScope = new PersonenkontextScope().findBy({ personId });
        const [kontexte]: Counted<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.findBy(scope);
        const response: PersonInfoResponse = await this.mapper.mapToPersonInfoResponse(person, kontexte);

        return response;
    }
}
