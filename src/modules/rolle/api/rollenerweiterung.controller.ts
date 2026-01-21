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
import { ClassLogger } from '../../../core/logging/class-logger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter';
import { RolleExceptionFilter } from './rolle-exception-filter';
import { PersonPermissions } from '../../authentication/domain/person-permissions';
import { RollenSystemRecht } from '../domain/systemrecht';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error';
import { ApplyRollenerweiterungPathParams } from './applyRollenerweiterungChanges.path.params';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo';
import { ServiceProvider } from '../../service-provider/domain/service-provider';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository';
import { Organisation } from '../../organisation/domain/organisation';
import { ApplyRollenerweiterungBodyParams } from './applyRollenerweiterung.body.params';
import { RolleRepo } from '../repo/rolle.repo';
import { uniq } from 'lodash-es';
import { Rolle } from '../domain/rolle';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo';
import { Rollenerweiterung } from '../domain/rollenerweiterung';
import { Err } from '../../../shared/util/result';

@UseFilters(new SchulConnexValidationErrorFilter(), new RolleExceptionFilter(), new AuthenticationExceptionFilter())
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
        this.logger.info('applyRollenerweiterungChanges called');
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
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('TBD')),
            );
        }
        const existingErweiterungen: Array<Rollenerweiterung<true>> =
            await this.rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId(orgaId, angebotId);

        const erweiterungenPromises: Promise<Result<Rollenerweiterung<true>, DomainError>>[] =
            body.addErweiterungenForRolleIds
                .filter((rolleId: string) => {
                    return (
                        existingErweiterungen.findIndex((re: Rollenerweiterung<true>) => re.rolleId === rolleId) === -1
                    );
                })
                .map((rolleId: string) => {
                    const rolle: Option<Rolle<true>> = rollen.get(rolleId);
                    if (!rolle) {
                        return Promise.resolve(Err(new EntityNotFoundError('Rolle', rolleId)));
                    }
                    return this.rollenerweiterungRepo.createAuthorized(
                        Rollenerweiterung.createNew(
                            this.organisationRepo,
                            this.rolleRepo,
                            this.serviceProviderRepo,
                            orgaId,
                            rolleId,
                            angebotId,
                        ),
                        permissions,
                    );
                });

        const removePromises: Promise<Result<null, DomainError>>[] = body.removeErweiterungenForRolleIds
            .filter((rolleId: string) => {
                return existingErweiterungen.findIndex((re: Rollenerweiterung<true>) => re.rolleId === rolleId) !== -1;
            })
            .map((rolleId: string) => {
                const rolle: Option<Rolle<true>> = rollen.get(rolleId);
                if (!rolle) {
                    return Promise.resolve(Err(new EntityNotFoundError('Rolle', rolleId)));
                }
                return this.rollenerweiterungRepo.deleteByIds({
                    organisationId: orgaId,
                    rolleId: rolleId,
                    serviceProviderId: angebotId,
                });
            });

        await Promise.all([...erweiterungenPromises, ...removePromises]);
    }
}
