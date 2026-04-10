import { ConfigService } from '@nestjs/config';
import { uniqBy } from 'lodash-es';
import { EmailAddressResponse } from '../../../email/modules/core/api/dtos/response/email-address.response.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { EmailResolverService } from '../../email-microservice/domain/email-resolver.service.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import {
    DBiamPersonenkontextRepo,
    ErweiterterServiceProviderForPK,
    ExternalPkData,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RequiredExternalPkData } from '../api/authentication.controller.js';
import { OXContextID } from '../../../shared/types/ox-ids.types.js';
import { EmailAddressStatusEnum } from '../../../email/modules/core/persistence/email-address-status.entity.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';

export class UserExternaldataWorkflowAggregate {
    public contextID: OXContextID;

    public oxLoginId?: string;

    public person?: Person<true>;

    public checkedExternalPkData?: RequiredExternalPkData[];

    public erweiterteSP?: ErweiterterServiceProviderForPK[];

    private constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepository,
        configService: ConfigService<ServerConfig>,
        private readonly emailResolverService: EmailResolverService,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.contextID = oxConfig.CONTEXT_ID;
    }

    public static createNew(
        personenkontextRepo: DBiamPersonenkontextRepo,
        personRepo: PersonRepository,
        configService: ConfigService<ServerConfig>,
        emailResolverService: EmailResolverService,
    ): UserExternaldataWorkflowAggregate {
        return new UserExternaldataWorkflowAggregate(
            personenkontextRepo,
            personRepo,
            configService,
            emailResolverService,
        );
    }

    public async initialize(personId: string): Promise<Option<DomainError>> {
        const person: Option<Person<true>> = await this.personRepo.findById(personId);
        const externalPkData: ExternalPkData[] = await this.personenkontextRepo.findExternalPkData(personId);
        this.erweiterteSP = await this.personenkontextRepo.findErweiterteSPByPersonId(personId);

        if (!person) {
            return new EntityNotFoundError('Person', personId);
        }
        this.person = person;

        if (this.emailResolverService.shouldUseEmailMicroservice()) {
            const personEmailResponse: Result<
                Option<EmailAddressResponse>,
                DomainError
            > = await this.emailResolverService.findEmailBySpshPersonAsEmailAddressResponse(personId);

            // Set undefined as default, if microservice is enabled
            this.person.email = undefined;
            this.oxLoginId = undefined;

            if (personEmailResponse.ok) {
                if (personEmailResponse.value) {
                    if (personEmailResponse.value.status === EmailAddressStatusEnum.ACTIVE) {
                        this.person.email = personEmailResponse.value.address;
                    }

                    if (personEmailResponse.value.status !== EmailAddressStatusEnum.SUSPENDED) {
                        this.oxLoginId = personEmailResponse.value.oxLoginId;
                    }
                }
            } else {
                return personEmailResponse.error;
            }
        }

        // Filtering out !expk.kennung || !expk.rollenart automatically leads to only valid organisations of type SCHOOLS are included
        // Additionally If there is an data-invalidity the Endpoint still works (If throwing Errors not) and allows the Keycloak the get the data for the other Personenkontexte
        this.checkedExternalPkData = externalPkData
            .map((expk: ExternalPkData) => {
                if (expk.pkId && expk.kennung && expk.rollenart && expk.serviceProvider) {
                    return {
                        pkId: expk.pkId,
                        rollenart: expk.rollenart,
                        serviceProvider: expk.serviceProvider,
                        kennung: expk.kennung,
                    } satisfies RequiredExternalPkData;
                }
                return undefined;
            })
            .filter((item: RequiredExternalPkData | undefined): item is RequiredExternalPkData => item !== undefined);

        return undefined;
    }

    public static mergeServiceProviders(
        externalPkData: RequiredExternalPkData[],
        erweiterteSP: ErweiterterServiceProviderForPK[],
    ): RequiredExternalPkData[] {
        const erweiterungenMap: Map<string, ServiceProvider<true>[]> = new Map<string, ServiceProvider<true>[]>();
        for (const erweiterung of erweiterteSP) {
            const pkId: string = erweiterung.personenkontext.id;
            const sp: ServiceProvider<true> = erweiterung.serviceProvider;
            if (!erweiterungenMap.has(pkId)) {
                erweiterungenMap.set(pkId, []);
            }
            erweiterungenMap.get(pkId)?.push(sp);
        }

        return externalPkData.map((pk: RequiredExternalPkData) => {
            const extraSp: ServiceProvider<true>[] = erweiterungenMap.get(pk.pkId) ?? [];
            const mergedSp: ServiceProvider<true>[] = [...pk.serviceProvider, ...extraSp];
            const uniqueSp: ServiceProvider<true>[] = uniqBy(mergedSp, 'id');

            return {
                ...pk,
                serviceProvider: uniqueSp,
            };
        });
    }

    public static getExternalPkDataWithSpWithVidisAngebotId(
        externalPkData: RequiredExternalPkData[],
    ): RequiredExternalPkData[] {
        return externalPkData.filter((pk: RequiredExternalPkData): pk is RequiredExternalPkData =>
            pk.serviceProvider.some((sp: ServiceProvider<true>) => Boolean(sp.vidisAngebotId)),
        );
    }
}
