import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { uniq } from 'lodash-es';
import { Rolle } from './rolle.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { Rollenerweiterung } from './rollenerweiterung.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { Injectable } from '@nestjs/common';
import { RollenSystemRecht } from './systemrecht.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from './missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { ApplyRollenerweiterungChangesBodyParams } from '../api/apply-rollenerweiterung-changes.body.params.js';
import { ApplyRollenerweiterungServiceProvidersError } from '../api/apply-rollenerweiterung-service-providers.error.js';
import { isMPTRolle, RollenArt } from './rolle.enums.js';

type TunknownResultForServiceProvider = {
    serviceProviderId: string;
    result: Result<unknown, DomainError>;
};

type TerrorResultForServiceProvider = {
    serviceProviderId: string;
    result: {
        ok: false;
        error: DomainError;
    };
};

function isErrorResultForServiceProvider<T>(r: {
    result: Result<T, DomainError>;
}): r is TerrorResultForServiceProvider {
    return r.result.ok === false;
}

@Injectable()
export class ApplyRollenerweiterungWithRoleForAngeboteService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    public async applyRollenerweiterungChangesWithRoleForAngebote(
        orgaId: string,
        rolleId: string,
        body: ApplyRollenerweiterungChangesBodyParams,
        permissions: IPersonPermissions,
    ): Promise<
        Result<null, ApplyRollenerweiterungServiceProvidersError | EntityNotFoundError | MissingPermissionsError>
    > {
        if (!(await permissions.hasSystemrechtAtOrganisation(orgaId, RollenSystemRecht.ROLLEN_ERWEITERN))) {
            return Err(new MissingPermissionsError('Not authorized'));
        }

        const organisation: Option<Organisation<true>> = await this.organisationRepo.findById(orgaId);
        if (!organisation) {
            this.logger.error(
                `applyRollenerweiterungChangesForRolle called by ${permissions.personFields.username} - ${permissions.personFields.id} for not existing organisation ${orgaId}`,
            );
            return Err(new EntityNotFoundError('Orga', orgaId));
        }

        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds([rolleId]);
        const rolle: Option<Rolle<true>> = rollen.get(rolleId);

        if (!rolle) {
            this.logger.error(
                `applyRollenerweiterungChangesForRolle called by ${permissions.personFields.username} - ${permissions.personFields.id} for not existing rolle ${rolleId}`,
            );
            return Err(new EntityNotFoundError('Rolle', rolleId));
        }
        if (
            isMPTRolle(rolle) &&
            !permissions.hasSystemrechtAtOrganisation(orgaId, RollenSystemRecht.MPTR_ROLLEN_VERWALTEN)
        ) {
            return Err(new MissingPermissionsError('Not authorized'));
        }

        const existingErweiterungen: Rollenerweiterung<true>[] =
            await this.rollenerweiterungRepo.findManyByOrganisationAndRolle([
                {
                    organisationId: orgaId,
                    rolleId,
                },
            ]);

        const serviceProviders: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            uniq([...body.addErweiterungenForServiceProviderIds, ...body.removeErweiterungenForServiceProviderIds]),
        );

        const [addResults, removeResults]: [TunknownResultForServiceProvider[], TunknownResultForServiceProvider[]] =
            await Promise.all([
                Promise.all(
                    this.handleAddErweiterungen(
                        orgaId,
                        rolleId,
                        existingErweiterungen,
                        body.addErweiterungenForServiceProviderIds,
                        serviceProviders,
                        permissions,
                    ),
                ),
                Promise.all(
                    this.handleRemoveErweiterungen(
                        orgaId,
                        rolleId,
                        existingErweiterungen,
                        body.removeErweiterungenForServiceProviderIds,
                        serviceProviders,
                    ),
                ),
            ]);

        const results: TunknownResultForServiceProvider[] = [...addResults, ...removeResults];
        const errors: TerrorResultForServiceProvider[] = results.filter(isErrorResultForServiceProvider);

        if (errors.length > 0) {
            return Err(
                new ApplyRollenerweiterungServiceProvidersError(
                    errors.map((e: TerrorResultForServiceProvider) => ({
                        serviceProviderId: e.serviceProviderId,
                        error: e.result.error,
                    })),
                ),
            );
        }

        return Ok(null);
    }

    private handleAddErweiterungen(
        orgaId: string,
        rolleId: string,
        existingErweiterungen: Array<Rollenerweiterung<true>> = [],
        addErweiterungenForServiceProviderIds: string[],
        serviceProviders: Map<string, ServiceProvider<true>>,
        permissions: IPersonPermissions,
    ): Promise<{
        serviceProviderId: string;
        result: Result<Rollenerweiterung<true>, DomainError>;
    }>[] {
        const erweiterungenPromises: Promise<{
            serviceProviderId: string;
            result: Result<Rollenerweiterung<true>, DomainError>;
        }>[] = addErweiterungenForServiceProviderIds
            .filter((serviceProviderId: string) => {
                return (
                    existingErweiterungen.findIndex(
                        (re: Rollenerweiterung<true>) => re.serviceProviderId === serviceProviderId,
                    ) === -1
                );
            })
            .map((serviceProviderId: string) => {
                const serviceProvider: Option<ServiceProvider<true>> = serviceProviders.get(serviceProviderId);

                this.logger.info(
                    `Adding Erweiterung for serviceProviderId: ${serviceProviderId}, orgaId: ${orgaId}, rolleId: ${rolleId}`,
                );

                if (!serviceProvider) {
                    return Promise.resolve({
                        serviceProviderId,
                        result: Err(new EntityNotFoundError('ServiceProvider', serviceProviderId)),
                    });
                }

                if (!serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG)) {
                    return Promise.resolve({
                        serviceProviderId,
                        result: Err(new MissingMerkmalVerfuegbarFuerRollenerweiterungError()),
                    });
                }

                return this.rollenerweiterungRepo
                    .createAuthorized(
                        Rollenerweiterung.createNew(
                            this.organisationRepo,
                            this.rolleRepo,
                            this.serviceProviderRepo,
                            orgaId,
                            rolleId,
                            serviceProviderId,
                        ),
                        permissions,
                    )
                    .then((result: Result<Rollenerweiterung<true>, DomainError>) => ({
                        serviceProviderId,
                        result,
                    }));
            });

        return erweiterungenPromises;
    }

    private handleRemoveErweiterungen(
        orgaId: string,
        rolleId: string,
        existingErweiterungen: Array<Rollenerweiterung<true>> = [],
        removeErweiterungenForServiceProviderIds: string[],
        serviceProviders: Map<string, ServiceProvider<true>>,
    ): Promise<{ serviceProviderId: string; result: Result<null, DomainError> }>[] {
        const removeErweiterungenPromises: Promise<{
            serviceProviderId: string;
            result: Result<null, DomainError>;
        }>[] = removeErweiterungenForServiceProviderIds
            .filter((serviceProviderId: string) => {
                return (
                    existingErweiterungen.findIndex(
                        (re: Rollenerweiterung<true>) => re.serviceProviderId === serviceProviderId,
                    ) !== -1
                );
            })
            .map((serviceProviderId: string) => {
                const serviceProvider: Option<ServiceProvider<true>> = serviceProviders.get(serviceProviderId);

                this.logger.info(
                    `Removing Erweiterung for serviceProviderId: ${serviceProviderId}, orgaId: ${orgaId}, rolleId: ${rolleId}`,
                );

                if (!serviceProvider) {
                    return Promise.resolve({
                        serviceProviderId,
                        result: Err(new EntityNotFoundError('ServiceProvider', serviceProviderId)),
                    });
                }

                return this.rollenerweiterungRepo
                    .deleteByComposedId({
                        organisationId: orgaId,
                        rolleId,
                        serviceProviderId,
                    })
                    .then((result: Result<null, DomainError>) => ({
                        serviceProviderId,
                        result,
                    }));
            });

        return removeErweiterungenPromises;
    }
}
