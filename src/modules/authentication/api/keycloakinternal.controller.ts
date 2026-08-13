import { Body, Controller, HttpCode, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExternalDataCacheInterceptor } from '../../../shared/cache/external-data-cache-interceptor.js';
import { DomainError } from '../../../shared/error/index.js';
import { UserExternalDataWorkflowError } from '../../../shared/error/user-externaldata-workflow.error.js';
import { EmailResolverService } from '../../email-microservice/domain/email-resolver.service.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import {
    ErweiterterServiceProviderForPK,
    ExternalPkData,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { UserExternaldataWorkflowFactory } from '../domain/user-extenaldata.factory.js';
import { UserExternaldataWorkflowAggregate } from '../domain/user-extenaldata.workflow.js';
import { AccessApiKeyGuard } from './access.apikey.guard.js';
import { NewOxParams, OldOxParams } from './externaldata/user-externaldata-ox.response.js';
import { UserExternalDataResponse } from './externaldata/user-externaldata.response.js';
import { Public } from './public.decorator.js';

type WithoutOptional<T> = {
    [K in keyof T]-?: T[K];
};

export type RequiredExternalPkData = WithoutOptional<ExternalPkData>;

type InitializedWorkflow = UserExternaldataWorkflowAggregate & {
    person: Person<true>;
    checkedExternalPkData: RequiredExternalPkData[];
    erweiterteSP: ErweiterterServiceProviderForPK[];
};

@ApiTags('Keycloakinternal')
@Controller({ path: 'keycloakinternal' })
export class KeycloakInternalController {
    public constructor(
        private readonly userExternaldataWorkflowFactory: UserExternaldataWorkflowFactory,
        private readonly personRepository: PersonRepository,
        private readonly emailResolverService: EmailResolverService,
    ) {}

    /**
     * Dieser Endpunkt fragt lediglich Daten ab ist allerdigs trotzdem als POST definiert, da:
     * Die Url sollte keine Path oder Query Paremeters haben da Sie statisch in der Keycloak UI hinterlegt werden muss
     * Trotzdem muss die Keycloak Sub übermittelt werden (Deshalb POST mit Body)
     **/
    @UseInterceptors(ExternalDataCacheInterceptor)
    @Post('externaldata')
    @HttpCode(200)
    @Public()
    @UseGuards(AccessApiKeyGuard)
    @ApiOperation({ summary: 'External Data about requested in user.' })
    @ApiOkResponse({ description: 'Returns external Data about the requested user.', type: UserExternalDataResponse })
    public async getExternalData(@Body() params: { sub: string }): Promise<UserExternalDataResponse> {
        const person: Option<Person<true>> = await this.personRepository.findByKeycloakUserId(params.sub);
        this.checkPerson(person);

        const workflow: UserExternaldataWorkflowAggregate = this.userExternaldataWorkflowFactory.createNew();
        const workflowInitializeError: Option<DomainError> = await workflow.initialize(person.id);
        this.checkWorkflowInitialized(workflowInitializeError, workflow);

        const oxParams: NewOxParams | OldOxParams | undefined = this.getOxParams(workflow);
        const userExternalDataResponse: UserExternalDataResponse = UserExternalDataResponse.createNew(
            workflow.person,
            workflow.checkedExternalPkData,
            workflow.erweiterteSP,
            oxParams,
            workflow.email,
        );

        return userExternalDataResponse;
    }

    private getOxParams(workflow: InitializedWorkflow): NewOxParams | OldOxParams | undefined {
        let oxParams: NewOxParams | OldOxParams | undefined;

        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            oxParams = this.getNewOxParams(workflow);
        } else {
            oxParams = this.getOldOxParams(workflow);
        }

        return oxParams;
    }

    private getNewOxParams(workflow: InitializedWorkflow): NewOxParams | undefined {
        let oxParams: NewOxParams | undefined = undefined;

        if (workflow.oxLoginId) {
            oxParams = { oxLoginId: workflow.oxLoginId };
        }

        return oxParams;
    }

    private getOldOxParams(workflow: InitializedWorkflow): OldOxParams | undefined {
        const mergedExternalPkData: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
            workflow.checkedExternalPkData,
            workflow.erweiterteSP,
        );

        let oxParams: OldOxParams | undefined = undefined;
        if (this.hasEmail(mergedExternalPkData)) {
            oxParams = {
                contextId: workflow.contextID,
                username: workflow.person.username!,
            };
        }

        return oxParams;
    }

    private hasEmail(mergedExternalPkData: RequiredExternalPkData[]): boolean {
        return mergedExternalPkData.some((pkData: RequiredExternalPkData) =>
            pkData.serviceProvider.some(
                (sp: ServiceProvider<true>) => sp.externalSystem === ServiceProviderSystem.EMAIL,
            ),
        );
    }

    private checkPerson(person: Option<Person<true>>): asserts person is Person<true> {
        if (!person) {
            throw new Error('Person is not defined');
        }
    }

    private checkWorkflowInitialized(
        error: Option<DomainError>,
        workflow: UserExternaldataWorkflowAggregate,
    ): asserts workflow is InitializedWorkflow {
        if (error || !workflow.person || !workflow.checkedExternalPkData) {
            throw new UserExternalDataWorkflowError(
                'UserExternaldataWorkflowAggregate has not been successfully initialized',
            );
        }
    }
}
