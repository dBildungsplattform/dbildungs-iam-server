import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { uniq } from 'lodash-es';

import { ClassLogger } from '../../../core/logging/class-logger.js';
import { FeatureFlagConfig } from '../../../shared/config/featureflag.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { VidisConfig } from '../../../shared/config/vidis.config.js';
import { OrganisationID, RolleID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { VidisAngebot } from '../../vidis/domain/vidis-angebot.js';
import { VidisService } from '../../vidis/vidis.service.js';
import { OrganisationServiceProviderRepo } from '../repo/organisation-service-provider.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from './service-provider.enum.js';
import { ServiceProvider } from './service-provider.js';
import {
    ManageableServiceProviderWithReferencedObjects,
    RollenerweiterungForManageableServiceProvider,
} from './types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';

@Injectable()
export class ServiceProviderService {
    private readonly vidisConfig: VidisConfig;

    private readonly isFeatureRolleErweiternEnabled: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly vidisService: VidisService,
        private readonly organisationServiceProviderRepo: OrganisationServiceProviderRepo,
        configService: ConfigService<ServerConfig>,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
        const featureFlags: FeatureFlagConfig = configService.getOrThrow<FeatureFlagConfig>('FEATUREFLAG');
        this.isFeatureRolleErweiternEnabled = featureFlags.FEATURE_FLAG_ROLLE_ERWEITERN;
    }

    public async getServiceProvidersByRolleIds(rolleIds: string[]): Promise<ServiceProvider<true>[]> {
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(uniq(rolleIds));
        const serviceProviderIds: Array<string> = uniq(
            Array.from(rollen.values()).flatMap((rolle: Rolle<true>) => rolle.serviceProviderIds),
        );
        const serviceProviders: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            serviceProviderIds,
        );

        return Array.from(serviceProviders.values());
    }

    public async getServiceProvidersByOrganisationenAndRollen(
        ids: Array<{ organisationId: string; rolleId: string }>,
    ): Promise<ServiceProvider<true>[]> {
        const uniqueRollenIds: RolleID[] = uniq(
            ids.map((idTuple: { organisationId: string; rolleId: string }) => idTuple.rolleId),
        );
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(uniqueRollenIds);
        const serviceProviderIds: Set<ServiceProviderID> = new Set();
        for (const rolle of rollen.values()) {
            for (const id of rolle.serviceProviderIds) {
                serviceProviderIds.add(id);
            }
        }

        if (this.isFeatureRolleErweiternEnabled) {
            const rollenerweiterungen: Array<Rollenerweiterung<true>> =
                await this.rollenerweiterungRepo.findManyByOrganisationAndRolle(ids);
            for (const rollenerweiterung of rollenerweiterungen) {
                serviceProviderIds.add(rollenerweiterung.serviceProviderId);
            }
        }

        const serviceProviders: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            Array.from(serviceProviderIds),
        );

        return Array.from(serviceProviders.values());
    }

    public async getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung(
        organisationId: OrganisationID,
        permissions: PersonPermissions,
        limit?: number,
        offset?: number,
    ): Promise<Counted<ServiceProvider<true>>> {
        const hasPermission: boolean = await permissions.hasSystemrechtAtOrganisation(
            organisationId,
            RollenSystemRecht.ROLLEN_ERWEITERN,
        );
        if (!hasPermission) {
            throw new ForbiddenException('Rollen Erweitern Systemrecht Required For This Endpoint');
        }
        const parents: Organisation<true>[] = await this.organisationRepo.findParentOrgasForIds([organisationId]);
        const organisationWithParentsIds: OrganisationID[] = [
            organisationId,
            ...parents.map((orga: Organisation<true>) => orga.id),
        ];
        return this.serviceProviderRepo.findByOrgasWithMerkmal(
            organisationWithParentsIds,
            ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
            limit,
            offset,
        );
    }

    public async getOrganisationRollenAndRollenerweiterungenForServiceProviders(
        serviceProviders: ServiceProvider<true>[],
        limitRoles?: number,
    ): Promise<ManageableServiceProviderWithReferencedObjects[]> {
        const serviceProvidersIds: ServiceProviderID[] = serviceProviders.map((sp: ServiceProvider<true>) => sp.id);
        const rollen: Map<ServiceProviderID, Rolle<true>[]> = await this.rolleRepo.findByServiceProviderIds(
            serviceProvidersIds,
            limitRoles,
        );
        const rollenerweiterungen: Map<ServiceProviderID, Rollenerweiterung<true>[]> =
            await this.rollenerweiterungRepo.findByServiceProviderIds(serviceProvidersIds);
        const organisationen: Map<ServiceProviderID, Organisation<true>> = await this.organisationRepo.findByIds(
            serviceProviders.map((sp: ServiceProvider<true>) => sp.providedOnSchulstrukturknoten),
        );

        return serviceProviders.map((serviceProvider: ServiceProvider<true>) => ({
            serviceProvider,
            organisation: organisationen.get(serviceProvider.providedOnSchulstrukturknoten)!,
            rollen: rollen.get(serviceProvider.id) ?? [],
            rollenerweiterungen: rollenerweiterungen.get(serviceProvider.id) ?? [],
        }));
    }

    public async getRollenerweiterungenForManageableServiceProvider(
        rollenerweiterungen: Rollenerweiterung<true>[],
    ): Promise<RollenerweiterungForManageableServiceProvider[]> {
        const organisationen: Map<OrganisationID, Organisation<true>> = await this.organisationRepo.findByIds(
            rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => rollenerweiterung.organisationId),
        );
        const rollen: Map<RolleID, Rolle<true>> = await this.rolleRepo.findByIds(
            rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => rollenerweiterung.rolleId),
        );

        return rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => ({
            organisation: organisationen.get(rollenerweiterung.organisationId)!,
            rolle: rollen.get(rollenerweiterung.rolleId)!,
        }));
    }

    public async updateServiceProvidersForVidis(): Promise<void> {
        this.logger.info('Aktualisierung der ServiceProvider für VIDIS-Angebote wurde gestartet.');

        const vidisKeycloakGroup: string = this.vidisConfig.KEYCLOAK_GROUP;
        const vidisKeycloakRole: string = this.vidisConfig.KEYCLOAK_ROLE;
        const vidisRegionName: string = this.vidisConfig.REGION_NAME;
        const schulstrukturknoten: string = this.organisationRepo.ROOT_ORGANISATION_ID;

        const vidisAngebote: VidisAngebot[] = await this.vidisService.getActivatedAngeboteByRegion(vidisRegionName);

        const allMappingsBeenDeleted: boolean = await this.organisationServiceProviderRepo.deleteAll();
        if (allMappingsBeenDeleted) {
            this.logger.info('All mappings between Organisation and ServiceProvider were deleted.');
        }

        await Promise.allSettled(
            vidisAngebote.map(async (angebot: VidisAngebot) => {
                const existingServiceProvider: Option<ServiceProvider<true>> =
                    await this.serviceProviderRepo.findByVidisAngebotId(angebot.angebotId);

                const angebotLogoMediaType: string = this.determineMediaTypeFor(angebot.angebotLogo);

                let serviceProvider: ServiceProvider<false>;
                if (existingServiceProvider) {
                    serviceProvider = ServiceProvider.construct(
                        existingServiceProvider.id,
                        existingServiceProvider.createdAt,
                        existingServiceProvider.updatedAt,
                        angebot.angebotTitle,
                        ServiceProviderTarget.URL,
                        angebot.angebotLink,
                        ServiceProviderKategorie.ANGEBOTE,
                        schulstrukturknoten,
                        Buffer.from(angebot.angebotLogo, 'base64'),
                        angebotLogoMediaType,
                        vidisKeycloakGroup,
                        vidisKeycloakRole,
                        ServiceProviderSystem.NONE,
                        false,
                        angebot.angebotId,
                        existingServiceProvider.merkmale,
                    );
                    this.logger.info(`ServiceProvider for VIDIS Angebot '${serviceProvider.name}' already exists.`);
                } else {
                    serviceProvider = ServiceProvider.createNew(
                        angebot.angebotTitle,
                        ServiceProviderTarget.URL,
                        angebot.angebotLink,
                        ServiceProviderKategorie.ANGEBOTE,
                        schulstrukturknoten,
                        Buffer.from(angebot.angebotLogo, 'base64'),
                        angebotLogoMediaType,
                        vidisKeycloakGroup,
                        vidisKeycloakRole,
                        ServiceProviderSystem.NONE,
                        false,
                        angebot.angebotId,
                        [],
                    );
                    this.logger.info(`ServiceProvider for VIDIS Angebot '${serviceProvider.name}' was created.`);
                }
                const persistedServiceProvider: ServiceProvider<true> =
                    await this.serviceProviderRepo.save(serviceProvider);
                await Promise.allSettled(
                    angebot.schoolActivations.map(async (schoolActivation: string) => {
                        const orga: Organisation<true> | undefined = (
                            await this.organisationRepo.findByNameOrKennung(schoolActivation)
                        ).at(0); // Assumption: kennung is unique for an Organisation and is not contained in name or kennung of any other Organisation
                        if (orga) {
                            await this.organisationServiceProviderRepo.save(orga, persistedServiceProvider);
                            this.logger.info(`Mapping of '${serviceProvider.name}' to '${orga.name}' was saved.`);
                        }
                    }),
                );
            }),
        );

        const vidisServiceProviders: ServiceProvider<true>[] =
            await this.serviceProviderRepo.findByKeycloakGroup(vidisKeycloakGroup);
        const angeboteNamesInResponse: string[] = vidisAngebote.map((angebot: VidisAngebot) => angebot.angebotTitle);
        await Promise.allSettled(
            vidisServiceProviders.map(async (vsp: ServiceProvider<true>) => {
                if (!angeboteNamesInResponse.includes(vsp.name)) {
                    await this.serviceProviderRepo.deleteById(vsp.id);
                    this.logger.info(
                        `ServiceProvider '${vsp.name}' was deleted as it was not in VIDIS Angebote API response.`,
                    );
                }
            }),
        );

        this.logger.info(`ServiceProvider für VIDIS-Angebote erfolgreich aktualisiert.`);
    }

    /**
     * Determines the correct media type of the given Angebot logo.
     * Assumption: Expected media type is always one of the three: 'image/jpeg', 'image/png' or 'image/svg+xml'.
     * @param {base64EncodedLogo} base64EncodedLogo Base64 encoded logo
     */
    private determineMediaTypeFor(base64EncodedLogo: string): string {
        const MEDIA_SIGNATURES: { JPG: Buffer; PNG: Buffer } = {
            // JPG/JPEG file signature in hexadeciaml begins with: ff d8 ff
            JPG: Buffer.from([0xff, 0xd8, 0xff]),
            // PNG file signature in hexadeciaml begins with: 89  50  4e  47  0d  0a  1a  0a
            PNG: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        };

        const logoBuffer: Buffer = Buffer.from(base64EncodedLogo, 'base64');

        const first8Bytes: Buffer = logoBuffer.subarray(0, 8);
        if (first8Bytes.equals(MEDIA_SIGNATURES.PNG)) {
            return 'image/png';
        }

        const first3Bytes: Buffer = logoBuffer.subarray(0, 3);
        if (first3Bytes.equals(MEDIA_SIGNATURES.JPG)) {
            return 'image/jpeg';
        }

        return 'image/svg+xml';
    }
}
