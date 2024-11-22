import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';
import { VidisConfig } from '../../shared/config/vidis.config.js';
import { firstValueFrom } from 'rxjs';
import { VidisOfferResponse, VidisResponse } from './api/vidis-angebote-api.types.js';
import { VidisAngebot } from './domain/vidis-angebot.js';
import { ServerConfig } from '../../shared/config/server.config.js';
import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../core/logging/class-logger.js';

@Injectable()
export class VidisService {
    private readonly vidisConfig: VidisConfig;

    public constructor(
        private readonly httpService: HttpService,
        configService: ConfigService<ServerConfig>,
        private readonly logger: ClassLogger,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
    }

    public async getActivatedAngeboteByRegion(regionName: string): Promise<VidisAngebot[]> {
        const url: string = this.vidisConfig.BASE_URL + `/o/vidis-rest/v1.0/offers/activated/by-region/${regionName}`;
        this.logger.info(`Fetching activated Angebote for region: ${regionName}`);
        try {
            const response: AxiosResponse<VidisResponse<VidisOfferResponse>> = await firstValueFrom(
                this.httpService.get(url, {
                    auth: {
                        username: this.vidisConfig.USERNAME,
                        password: this.vidisConfig.PASSWORD,
                    },
                }),
            );
            const vidisOfferResponses: VidisOfferResponse[] = response.data.items;
            const vidisAngebote: VidisAngebot[] = vidisOfferResponses.map((offer: VidisOfferResponse) => {
                return {
                    angebotVersion: offer.offerVersion,
                    angebotDescription: offer.offerDescription,
                    angebotLink: offer.offerLink,
                    angebotLogo: offer.offerLogo,
                    angebotTitle: offer.offerTitle,
                    angebotLongTitle: offer.offerLongTitle,
                    educationProviderOrganizationName: offer.educationProviderOrganizationName,
                    schoolActivations: offer.schoolActivations,
                };
            });
            return vidisAngebote;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting all VIDIS Angebote: ${error.message}`);
            } else {
                throw new Error(`Error getting all VIDIS Angebote: Unknown error occurred`);
            }
        }
    }
}
