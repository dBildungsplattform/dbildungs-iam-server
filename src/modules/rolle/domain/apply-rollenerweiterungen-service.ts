import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { uniq } from 'lodash-es';
import { Rolle } from './rolle.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { Rollenerweiterung } from './rollenerweiterung.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { ApplyRollenerweiterungBodyParams } from '../api/apply-rollenerweiterung.body.params.js';
import { ApplyRollenerweiterungRolesError } from '../api/apply-rollenerweiterung-roles.error.js';
import { Injectable } from '@nestjs/common';
import { RollenSystemRecht } from './systemrecht.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from './missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';

type TunknownResultForRolle = {
    rolleId: string;
    result: Result<unknown, DomainError>;
};

type TerrorResultForRolle = {
    rolleId: string;
    result: {
        ok: false;
        error: DomainError;
    };
};

function isErrorResult<T>(r: { result: Result<T, DomainError> }): r is TerrorResultForRolle {
    return r.result.ok === false;
}

@Injectable()
export class ApplyRollenerweiterungService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    public async applyRollenerweiterungChanges(
        orgaId: string,
        angebotId: string,
        body: ApplyRollenerweiterungBodyParams,
        permissions: PersonPermissions,
    ): Promise<
        Result<
            null,
            | ApplyRollenerweiterungRolesError
            | EntityNotFoundError
            | MissingPermissionsError
            | MissingMerkmalVerfuegbarFuerRollenerweiterungError
        >
    > {
        if (!(await permissions.hasSystemrechtAtOrganisation(orgaId, RollenSystemRecht.ROLLEN_ERWEITERN))) {
            return Err(new MissingPermissionsError('Not authorized'));
        }
        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(angebotId);
        const organisation: Option<Organisation<true>> = await this.organisationRepo.findById(orgaId);
        if (!organisation) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for not existing organisation ${orgaId}`,
            );
            return Err(new EntityNotFoundError('Orga', orgaId));
        }
        if (!serviceProvider) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for not existing angebot ${angebotId}`,
            );
            return Err(new EntityNotFoundError('Angebot', angebotId));
        }

        if (!serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG)) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for existing angebot ${angebotId} which is not verfuegbar for rollenerweiterung`,
            );
            return Err(new MissingMerkmalVerfuegbarFuerRollenerweiterungError());
        }

        await this.rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId(orgaId, angebotId);
        const existingErweiterungen: Rollenerweiterung<true>[] =
            await this.rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId(orgaId, angebotId);
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(
            uniq([...body.addErweiterungenForRolleIds, ...body.removeErweiterungenForRolleIds]),
        );
        const [addResults, removeResults]: [TunknownResultForRolle[], TunknownResultForRolle[]] = await Promise.all([
            Promise.all(
                this.handleAddErweiterungen(
                    orgaId,
                    angebotId,
                    existingErweiterungen,
                    body.addErweiterungenForRolleIds,
                    rollen,
                    permissions,
                ),
            ),
            Promise.all(
                this.handleRemoveErweiterungen(
                    orgaId,
                    angebotId,
                    existingErweiterungen,
                    body.removeErweiterungenForRolleIds,
                    rollen,
                ),
            ),
        ]);
        const results: TunknownResultForRolle[] = [...addResults, ...removeResults];
        const errors: TerrorResultForRolle[] = results.filter(isErrorResult);

        if (errors.length > 0) {
            return Err(
                new ApplyRollenerweiterungRolesError(
                    errors.map((e: TerrorResultForRolle) => ({ rolleId: e.rolleId, error: e.result.error })),
                ),
            );
        }
        return Ok(null);
    }

    private handleRemoveErweiterungen(
        orgaId: string,
        angebotId: string,
        existingErweiterungen: Array<Rollenerweiterung<true>> = [],
        removeErweiterungenForRolleIds: string[],
        rollen: Map<string, Rolle<true>>,
    ): Promise<{ rolleId: string; result: Result<null, DomainError> }>[] {
        const removeErweiterungenPromises: Promise<{ rolleId: string; result: Result<null, DomainError> }>[] =
            removeErweiterungenForRolleIds
                .filter((rolleId: string) => {
                    return (
                        existingErweiterungen.findIndex((re: Rollenerweiterung<true>) => re.rolleId === rolleId) !== -1
                    );
                })
                .map((rolleId: string) => {
                    const rolle: Option<Rolle<true>> = rollen.get(rolleId);
                    this.logger.info(
                        `Removing Erweiterung for rolleId: ${rolleId}, orgaId: ${orgaId}, angebotId: ${angebotId}`,
                    );
                    if (!rolle) {
                        return Promise.resolve({ rolleId, result: Err(new EntityNotFoundError('Rolle', rolleId)) });
                    }
                    return this.rollenerweiterungRepo
                        .deleteByComposedId({
                            organisationId: orgaId,
                            rolleId: rolleId,
                            serviceProviderId: angebotId,
                        })
                        .then((result: Result<null, DomainError>) => ({ rolleId, result }));
                });
        return removeErweiterungenPromises;
    }

    private handleAddErweiterungen(
        orgaId: string,
        angebotId: string,
        existingErweiterungen: Array<Rollenerweiterung<true>> = [],
        addErweiterungenForRolleIds: string[],
        rollen: Map<string, Rolle<true>>,
        permissions: PersonPermissions,
    ): Promise<{
        rolleId: string;
        result: Result<Rollenerweiterung<true>, DomainError>;
    }>[] {
        const erweiterungenPromises: Promise<{
            rolleId: string;
            result: Result<Rollenerweiterung<true>, DomainError>;
        }>[] = addErweiterungenForRolleIds
            .filter((rolleId: string) => {
                return existingErweiterungen.findIndex((re: Rollenerweiterung<true>) => re.rolleId === rolleId) === -1;
            })
            .map((rolleId: string) => {
                const rolle: Option<Rolle<true>> = rollen.get(rolleId);
                this.logger.info(
                    `Adding Erweiterung for for rolleId: ${rolleId}, orgaId: ${orgaId}, angebotId: ${angebotId}`,
                );
                if (!rolle) {
                    return Promise.resolve({ rolleId, result: Err(new EntityNotFoundError('Rolle', rolleId)) });
                }
                return this.rollenerweiterungRepo
                    .createAuthorized(
                        Rollenerweiterung.createNew(
                            this.organisationRepo,
                            this.rolleRepo,
                            this.serviceProviderRepo,
                            orgaId,
                            rolleId,
                            angebotId,
                        ),
                        permissions,
                    )
                    .then((result: Result<Rollenerweiterung<true>, DomainError>) => ({ rolleId, result }));
            });
        return erweiterungenPromises;
    }
}
