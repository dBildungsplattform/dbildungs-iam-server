import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';
import { VidisConfig } from '../../shared/config/vidis.config.js';
import { firstValueFrom } from 'rxjs';
import { VidisOfferResponse, VidisResponse } from './api/vidis-offer-api.types.js';
import { ServerConfig } from '../../shared/config/server.config.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VidisService {
    private readonly vidisConfig: VidisConfig;

    public constructor(
        private readonly httpService: HttpService,
        configService: ConfigService<ServerConfig>,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
    }

    public async getActivatedOffersByRegion(regionName: string): Promise<VidisOfferResponse[]> {
        const url: string = this.vidisConfig.BASE_URL + `/o/vidis-rest/v1.0/offers/activated/by-region/${regionName}`;

        try {
            const response: AxiosResponse<VidisResponse<VidisOfferResponse>> = await firstValueFrom(
                this.httpService.get(url, {
                    auth: {
                        username: this.vidisConfig.USERNAME,
                        password: this.vidisConfig.PASSWORD,
                    },
                }),
            );
            const vidisOffers: VidisOfferResponse[] = response.data.items;
            return vidisOffers;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error getting all VIDIS offers: ${error.message}`);
            } else {
                throw new Error(`Error getting all VIDIS offers: Unknown error occurred`);
            }
        }
    }
}
