import { Controller, Get } from '@nestjs/common';
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

@ApiTags('person-info')
@Controller({ path: 'person-info' })
export class PersonInfoController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personRepository: PersonRepository,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {
        this.logger.info('personinfo controller created.');
    }

    @Get()
    @ApiBearerAuth()
    @ApiOAuth2(['openid'])
    @ApiOperation({ summary: 'Info about logged in person.' })
    @ApiUnauthorizedResponse({ description: 'person is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the person.', type: PersonInfoResponse })
    public async info(@Permissions() permissions: PersonPermissions): Promise<PersonInfoResponse> {
        this.logger.info('Getting info about person.');
        this.logger.info('Permissions: ' + permissions.personFields.id);
        const personId: string = permissions.personFields.id;
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Person', personId)),
            );
        }

        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);

        return new PersonInfoResponse(person, personenkontexte);
    }
}
