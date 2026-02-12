import { Body, Controller, HttpCode, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserExternalDataResponse } from './externaldata/user-externaldata.response.js';
import { ExternalPkData } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowFactory } from '../domain/user-extenaldata.factory.js';
import { UserExternaldataWorkflowAggregate } from '../domain/user-extenaldata.workflow.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { UserExternalDataWorkflowError } from '../../../shared/error/user-externaldata-workflow.error.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { AccessApiKeyGuard } from './access.apikey.guard.js';
import { Public } from './public.decorator.js';
import { EmailResolverService } from '../../email-microservice/domain/email-resolver.service.js';
import { NewOxParams, OldOxParams } from './externaldata/user-externaldata-ox.response.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { ExternalDataCacheInterceptor } from '../../../shared/cache/external-data-cache-interceptor.js';

type WithoutOptional<T> = {
    [K in keyof T]-?: T[K];
};

export type RequiredExternalPkData = WithoutOptional<ExternalPkData>;

@ApiTags('Keycloakinternal')
@Controller({ path: 'keycloakinternal' })
export class KeycloakInternalController {
    public constructor(
        private readonly userExternaldataWorkflowFactory: UserExternaldataWorkflowFactory,
        private readonly personRepository: PersonRepository,
        private readonly emailResolverService: EmailResolverService,
    ) {}

    /*
    Dieser Endpunkt fragt lediglich Daten ab ist allerdigs trotzdem als POST definiert, da:
    Die Url sollte keine Path oder Query Paremeters haben da Sie statisch in der Keycloak UI hinterlegt werden muss
    Trotzdem muss die Keycloak Sub übermittelt werden (Deshalb POST mit Body)
    */

    @UseInterceptors(ExternalDataCacheInterceptor)
    @Post('externaldata')
    @HttpCode(200)
    @Public()
    @UseGuards(AccessApiKeyGuard)
    @ApiOperation({ summary: 'External Data about requested in user.' })
    @ApiOkResponse({ description: 'Returns external Data about the requested user.', type: UserExternalDataResponse })
    public async getExternalData(@Body() params: { sub: string }): Promise<UserExternalDataResponse> {
        const person: Option<Person<true>> = await this.personRepository.findByKeycloakUserId(params.sub);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person with keycloak sub', params.sub),
                ),
            );
        }

        const workflow: UserExternaldataWorkflowAggregate = this.userExternaldataWorkflowFactory.createNew();
        const workflowInitializeError: Option<DomainError> = await workflow.initialize(person.id);
        if (workflowInitializeError || !workflow.person || !workflow.checkedExternalPkData) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new UserExternalDataWorkflowError(
                        'UserExternaldataWorkflowAggregate has not been successfull initialized',
                    ),
                ),
            );
        }

        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            const oxParams: NewOxParams = {
                oxLoginId: workflow.oxLoginId!,
            };
            return UserExternalDataResponse.createNew(
                workflow.person,
                workflow.checkedExternalPkData,
                workflow.personenKontextErweiterungen!,
                oxParams,
            );
        } else {
            // Check if user has email sp
            const mergedExternalPkData: RequiredExternalPkData[] =
                UserExternaldataWorkflowAggregate.mergeServiceProviders(
                    workflow.checkedExternalPkData,
                    workflow.personenKontextErweiterungen!,
                );

            const hasEmail: boolean = mergedExternalPkData.some((pkData: RequiredExternalPkData) =>
                pkData.serviceProvider.some(
                    (sp: ServiceProviderEntity) => sp.externalSystem === ServiceProviderSystem.EMAIL,
                ),
            );

            let oxParams: OldOxParams | undefined;
            if (hasEmail) {
                oxParams = {
                    contextId: workflow.contextID,
                    username: workflow.person.username!,
                };
            }

            return UserExternalDataResponse.createNew(
                workflow.person,
                workflow.checkedExternalPkData,
                workflow.personenKontextErweiterungen!,
                oxParams,
            );
        }
    }
}
