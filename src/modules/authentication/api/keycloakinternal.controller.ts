import { Controller, Get, Param } from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UserExeternalDataResponse } from './externaldata/user-externaldata.response.js';
import { ExternalPkData } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowFactory } from '../domain/user-extenaldata.factory.js';
import { UserExternaldataWorkflowAggregate } from '../domain/user-extenaldata.workflow.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { UserExternalDataWorkflowError } from '../../../shared/error/user-externaldata-workflow.error.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { Public } from './public.decorator.js';

type WithoutOptional<T> = {
    [K in keyof T]-?: T[K];
};

export type RequiredExternalPkData = WithoutOptional<ExternalPkData>;

@Controller({ path: 'keycloakinternal' })
@ApiExcludeController()
export class KeycloakInternalController {
    public constructor(
        private readonly userExternaldataWorkflowFactory: UserExternaldataWorkflowFactory,
        private readonly personRepository: PersonRepository,
    ) {}

    @Get('externaldata/:sub')
    @Public()
    @ApiOperation({ summary: 'External Data about requested in user.' })
    @ApiOkResponse({ description: 'Returns external Data about the requested user.', type: UserExeternalDataResponse })
    public async getExternalData(@Param('sub') keycloakSub: string): Promise<UserExeternalDataResponse> {
        const person: Option<Person<true>> = await this.personRepository.findByKeycloakUserId(keycloakSub);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person with keycloak sub', keycloakSub),
                ),
            );
        }

        const workflow: UserExternaldataWorkflowAggregate = this.userExternaldataWorkflowFactory.createNew();
        await workflow.initialize(person.id);
        if (!workflow.person || !workflow.checkedExternalPkData) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new UserExternalDataWorkflowError(
                        'UserExternaldataWorkflowAggregate has not been successfull initialized',
                    ),
                ),
            );
        }

        return UserExeternalDataResponse.createNew(workflow.person, workflow.checkedExternalPkData, workflow.contextID);
    }
}
