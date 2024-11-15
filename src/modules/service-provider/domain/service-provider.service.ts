import { Injectable } from '@nestjs/common';
import { uniq } from 'lodash-es';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProvider } from './service-provider.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { VidisService } from '../../vidis/vidis.service.js';
import { VidisOfferResponse } from '../../vidis/api/vidis-offer-api.types.js';
import { ServiceProviderTarget, ServiceProviderKategorie, ServiceProviderSystem } from './service-provider.enum.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationServiceProviderRepo } from '../repo/organisation-service-provider.repo.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { VidisConfig } from '../../../shared/config/vidis.config.js';

@Injectable()
export class ServiceProviderService {
    private readonly vidisConfig: VidisConfig;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly rolleRepo: RolleRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly vidisService: VidisService,
        private readonly organisationServiceProviderRepo: OrganisationServiceProviderRepo,
        configService: ConfigService<ServerConfig>,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
    }

    public async getServiceProvidersByRolleIds(rolleIds: string[]): Promise<ServiceProvider<true>[]> {
        const rollen: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rolleIds);
        const serviceProviderIds: Array<string> = uniq(
            Array.from(rollen.values()).flatMap((rolle: Rolle<true>) => rolle.serviceProviderIds),
        );
        const serviceProviders: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            serviceProviderIds,
        );

        return Array.from(serviceProviders.values());
    }

    public async updateServiceProvidersForVidis(): Promise<void> {
        this.logger.info('Update of service providers for VIDIS offers triggered.');

        const vidisKeycloakGroup: string = this.vidisConfig.KEYCLOAK_GROUP;
        const vidisKeycloakRole: string = this.vidisConfig.KEYCLOAK_ROLE;
        const vidisRegionName: string = this.vidisConfig.REGION_NAME;
        const schulstrukturknoten: string = this.organisationRepo.ROOT_ORGANISATION_ID;

        const vidisOffers: VidisOfferResponse[] = await this.vidisService.getActivatedOffersByRegion(vidisRegionName);

        const allMappingsBeenDeleted: boolean = await this.organisationServiceProviderRepo.deleteAll();
        if (allMappingsBeenDeleted)
            this.logger.info('All mappings between Organisation and ServiceProvider were deleted.');

        await Promise.allSettled(
            vidisOffers.map(async (offer: VidisOfferResponse) => {
                const existingServiceProvider: Option<ServiceProvider<true>> =
                    await this.serviceProviderRepo.findByName(offer.offerTitle);

                const offerLogoMediaType: string = this.determineMediaTypeFor(offer.offerLogo);

                let serviceProvider: ServiceProvider<false>;
                if (existingServiceProvider) {
                    serviceProvider = ServiceProvider.construct(
                        existingServiceProvider.id,
                        existingServiceProvider.createdAt,
                        existingServiceProvider.updatedAt,
                        offer.offerTitle,
                        ServiceProviderTarget.URL,
                        offer.offerLink,
                        ServiceProviderKategorie.ANGEBOTE,
                        schulstrukturknoten,
                        Buffer.from(offer.offerLogo, 'base64'),
                        offerLogoMediaType,
                        vidisKeycloakGroup,
                        vidisKeycloakRole,
                        ServiceProviderSystem.NONE,
                        false,
                    );
                    this.logger.info(`ServiceProvider for VIDIS offer '${serviceProvider.name}' already exists.`);
                } else {
                    serviceProvider = ServiceProvider.createNew(
                        offer.offerTitle,
                        ServiceProviderTarget.URL,
                        offer.offerLink,
                        ServiceProviderKategorie.ANGEBOTE,
                        schulstrukturknoten,
                        Buffer.from(offer.offerLogo, 'base64'),
                        offerLogoMediaType,
                        vidisKeycloakGroup,
                        vidisKeycloakRole,
                        ServiceProviderSystem.NONE,
                        false,
                    );
                    this.logger.info(`ServiceProvider for VIDIS offer '${serviceProvider.name}' was created.`);
                }
                const persistedServiceProvider: ServiceProvider<true> =
                    await this.serviceProviderRepo.save(serviceProvider);
                await Promise.allSettled(
                    offer.schoolActivations.map(async (schoolActivation: string) => {
                        const school: Result<
                            Organisation<true>,
                            DomainError
                        > = await this.organisationRepo.findByKennung(schoolActivation);
                        if (school.ok) {
                            await this.organisationServiceProviderRepo.save(school.value, persistedServiceProvider);
                            this.logger.info(
                                `Mapping of '${serviceProvider.name}' to '${school.value.name}' was saved.`,
                            );
                        }
                    }),
                );
            }),
        );

        const vidisServiceProviders: ServiceProvider<true>[] =
            await this.serviceProviderRepo.findByKeycloakGroup(vidisKeycloakGroup);
        const offerNamesInResponse: string[] = vidisOffers.map((offer: VidisOfferResponse) => offer.offerTitle);
        await Promise.allSettled(
            vidisServiceProviders.map(async (vsp: ServiceProvider<true>) => {
                if (!offerNamesInResponse.includes(vsp.name)) {
                    await this.serviceProviderRepo.deleteById(vsp.id);
                    this.logger.info(
                        `ServiceProvider '${vsp.name}' was deleted as it was not in VIDIS Offer API response.`,
                    );
                }
            }),
        );

        this.logger.info(`Update of service providers for VIDIS offers was successful.`);
    }

    /**
     * Determines the correct media type of the given offer logo.
     * Assumption: Expected media type is always one of the three: 'image/jpeg', 'image/png' or 'image/svg+xml'.
     * @param {base64EncodedLogo} base64EncodedLogo Base64 encoded logo
     */
    private determineMediaTypeFor(base64EncodedLogo: string): string {
        const logoBuffer: Buffer = Buffer.from(base64EncodedLogo, 'base64');

        // JPG/JPEG file signature in hexadeciaml begins with: ff d8 ff
        const jpgFileSignatureBuffer: Buffer = Buffer.from([0xff, 0xd8, 0xff]);
        // PNG file signature in hexadeciaml begins with: 89  50  4e  47  0d  0a  1a  0a
        const pngFileSignatureBuffer: Buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

        const first8BytesBuffer: Buffer = logoBuffer.subarray(0, 8);
        if (first8BytesBuffer.equals(pngFileSignatureBuffer)) return 'image/png';

        const first3BytesBuffer: Buffer = logoBuffer.subarray(0, 3);
        if (first3BytesBuffer.equals(jpgFileSignatureBuffer)) return 'image/jpeg';

        return 'image/svg+xml';
    }
}
