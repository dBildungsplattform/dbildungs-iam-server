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
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { ApplyRollenerweiterungBodyParams } from '../api/apply-rollenerweiterung.body.params.js';
import { ApplyRollenerweiterungRolesError } from '../api/apply-rollenerweiterung-roles.error.js';

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

function isErrorResult<T>(r: {
    result: Result<T, DomainError>;
}): r is { rolleId: string; result: { ok: false; error: DomainError } } {
    return r.result.ok === false;
}

export class ApplyRollenerweiterungWorkflowAggregate {
    private orgaId: string = '';

    private angebotId: string = '';

    private existingErweiterungen: Array<Rollenerweiterung<true>> = [];

    private constructor(
        private readonly logger: ClassLogger,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    public static createNew(
        logger: ClassLogger,
        serviceProviderRepo: ServiceProviderRepo,
        organisationRepo: OrganisationRepository,
        rolleRepo: RolleRepo,
        rollenerweiterungRepo: RollenerweiterungRepo,
    ): ApplyRollenerweiterungWorkflowAggregate {
        return new ApplyRollenerweiterungWorkflowAggregate(
            logger,
            serviceProviderRepo,
            organisationRepo,
            rolleRepo,
            rollenerweiterungRepo,
        );
    }

    public async initialize(orgaId: string, angebotId: string): Promise<void> {
        this.orgaId = orgaId;
        this.angebotId = angebotId;
        this.existingErweiterungen = await this.rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId(
            orgaId,
            angebotId,
        );
    }

    public async applyRollenerweiterungChanges(
        body: ApplyRollenerweiterungBodyParams,
        permissions: PersonPermissions,
    ): Promise<Result<null, ApplyRollenerweiterungRolesError>> {
        await this.rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId(this.orgaId, this.angebotId);
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(
            uniq([...body.addErweiterungenForRolleIds, ...body.removeErweiterungenForRolleIds]),
        );
        const [addResults, removeResults]: [TunknownResultForRolle[], TunknownResultForRolle[]] = await Promise.all([
            Promise.all(this.handleAddErweiterungen(body.addErweiterungenForRolleIds, rollen, permissions)),
            Promise.all(this.handleRemoveErweiterungen(body.removeErweiterungenForRolleIds, rollen)),
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
        removeErweiterungenForRolleIds: string[],
        rollen: Map<string, Rolle<true>>,
    ): Promise<{ rolleId: string; result: Result<null, DomainError> }>[] {
        const removeErweiterungenPromises: Promise<{ rolleId: string; result: Result<null, DomainError> }>[] =
            removeErweiterungenForRolleIds
                .filter((rolleId: string) => {
                    return (
                        this.existingErweiterungen.findIndex(
                            (re: Rollenerweiterung<true>) => re.rolleId === rolleId,
                        ) !== -1
                    );
                })
                .map((rolleId: string) => {
                    const rolle: Option<Rolle<true>> = rollen.get(rolleId);
                    this.logger.info(
                        `Removing Erweiterung for rolleId: ${rolleId}, orgaId: ${this.orgaId}, angebotId: ${this.angebotId}`,
                    );
                    if (!rolle) {
                        return Promise.resolve({ rolleId, result: Err(new EntityNotFoundError('Rolle', rolleId)) });
                    }
                    return this.rollenerweiterungRepo
                        .deleteByComposedId({
                            organisationId: this.orgaId,
                            rolleId: rolleId,
                            serviceProviderId: this.angebotId,
                        })
                        .then((result: Result<null, DomainError>) => ({ rolleId, result }));
                });
        return removeErweiterungenPromises;
    }

    private handleAddErweiterungen(
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
                return (
                    this.existingErweiterungen.findIndex((re: Rollenerweiterung<true>) => re.rolleId === rolleId) === -1
                );
            })
            .map((rolleId: string) => {
                const rolle: Option<Rolle<true>> = rollen.get(rolleId);
                this.logger.info(
                    `Adding Erweiterung for for rolleId: ${rolleId}, orgaId: ${this.orgaId}, angebotId: ${this.angebotId}`,
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
                            this.orgaId,
                            rolleId,
                            this.angebotId,
                        ),
                        permissions,
                    )
                    .then((result: Result<Rollenerweiterung<true>, DomainError>) => ({ rolleId, result }));
            });
        return erweiterungenPromises;
    }
}
