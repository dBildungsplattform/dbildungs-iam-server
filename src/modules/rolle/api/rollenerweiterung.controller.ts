import { UseFilters, Controller, Post, Param, Body } from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOAuth2,
    ApiOperation,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../domain/systemrecht.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { ApplyRollenerweiterungPathParams } from './applyRollenerweiterungChanges.path.params.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ApplyRollenerweiterungBodyParams } from './applyRollenerweiterung.body.params.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { uniq } from 'lodash-es';
import { Rolle } from '../domain/rolle.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { Err } from '../../../shared/util/result.js';
import { ApplyRollenerweiterungRolesError } from './apply-rollenerweiterung-roles.error.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { RollenerweiterungExceptionFilter } from './rollenerweiterung-exception-filter.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { ApplyRollenerweiterungMultiExceptionFilter } from './apply-rollenerweiterung-multi-exception-filter.js';

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
@UseFilters(
    new SchulConnexValidationErrorFilter(),
    new AuthenticationExceptionFilter(),
    new RollenerweiterungExceptionFilter(),
    new ApplyRollenerweiterungMultiExceptionFilter(),
)
@ApiTags('rolle')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'rollen-erweiterung' })
export class RollenerweiterungController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    @Post('/angebot/:angebotId/organisation/:organisationId/apply')
    @ApiOperation({ description: 'Apply changes to rollen-erweiterung for a given angebot and organisation.' })
    @Public()
    @ApiNoContentResponse({
        description: 'Changes applied successfully.',
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
    })
    public async applyRollenerweiterungChanges(
        @Param() params: ApplyRollenerweiterungPathParams,
        @Body() body: ApplyRollenerweiterungBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<void> {
        this.logger.info(
            `applyRollenerweiterungChanges called by ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} with ${body.addErweiterungenForRolleIds.length} additions and ${body.removeErweiterungenForRolleIds.length} removals.`,
        );
        const angebotId: string = params.angebotId;
        const orgaId: string = params.organisationId;
        if (!(await permissions.hasSystemrechtAtOrganisation(orgaId, RollenSystemRecht.ROLLEN_ERWEITERN))) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new MissingPermissionsError('Not authorized to ROLLEN_ERWEITERN for this organisation'),
                ),
            );
        }
        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(angebotId);
        const organisation: Option<Organisation<true>> = await this.organisationRepo.findById(orgaId);
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(
            uniq([...body.addErweiterungenForRolleIds, ...body.removeErweiterungenForRolleIds]),
        );
        if (!organisation) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Orga', orgaId)),
            );
        }
        if (!serviceProvider) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Angebot', angebotId)),
            );
        }

        if (!serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG)) {
            throw new MissingMerkmalVerfuegbarFuerRollenerweiterungError();
        }
        const existingErweiterungen: Array<Rollenerweiterung<true>> =
            await this.rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId(orgaId, angebotId);

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
            this.logger.info('D');
            throw new ApplyRollenerweiterungRolesError(
                errors.map((e: TerrorResultForRolle) => ({ rolleId: e.rolleId, error: e.result.error })),
            );
        }
    }

    private handleRemoveErweiterungen(
        orgaId: string,
        angebotId: string,
        existingErweiterungen: Array<Rollenerweiterung<true>>,
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
                    this.logger.debug(`Removing Erweiterung for rolleId: ${rolleId}`);
                    if (!rolle) {
                        this.logger.debug(`Rolle not found for rolleId: ${rolleId}`);
                        return Promise.resolve({ rolleId, result: Err(new EntityNotFoundError('Rolle', rolleId)) });
                    }
                    return this.rollenerweiterungRepo
                        .deleteByIds({
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
        existingErweiterungen: Array<Rollenerweiterung<true>>,
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
                this.logger.debug(`Adding Erweiterung for rolleId: ${rolleId}`);
                if (!rolle) {
                    this.logger.debug(`Rolle not found for rolleId: ${rolleId}`);
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
