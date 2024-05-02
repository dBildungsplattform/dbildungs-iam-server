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
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Person } from '../domain/person.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { PersonInfoResponse } from './person-info.response.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { PersonApiMapper } from '../mapper/person-api.mapper.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('person-info')
@Controller({ path: 'person-info' })
export class PersonInfoController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personRepository: PersonRepository,
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
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError(Person.name, personId)),
            );
        }

        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);
        const response: PersonInfoResponse = this.mapper.toPersonInfoResponse(personId, person, personenkontexte);

        return response;
    }
}
