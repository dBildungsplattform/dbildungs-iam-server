import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { VidisConfig } from '../../../shared/config/vidis.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { VidisResponse } from '../api/vidis-angebote-api.types.js';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VidisApiService {
    private readonly vidisConfig: VidisConfig;

    private static readonly PREFIX_VIDIS_SCHOOOL_ID: string = 'DE-SH-';

    private static readonly PATH_GET_AUTH_TOKEN: string = '/o/oauth2/token';

    private static readonly PATH_GET_ACTIVATED_ANGEBOTE_BY_REGION: string = '/o/vidis-rest/v1.0/offers/activated/by-region/Schleswig-Holstein';

    private static pathGetActivatedAngeboteBySchool(vidisSchoolId: string): string {
        return `/o/vidis-rest/v1.0/offers/activated/by-school/${vidisSchoolId}`;
    }

    public constructor(
        private readonly httpService: HttpService,
        configService: ConfigService<ServerConfig>,
        private readonly logger: ClassLogger,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
    }


    public async getActivatedAngeboteByRegion(): Promise<void> {
            const token: string = await this.getAuthToken();
            const response: AxiosResponse<VidisResponse<unknown>> = await firstValueFrom(
                this.httpService.get(this.constructUrl(VidisApiService.PATH_GET_ACTIVATED_ANGEBOTE_BY_REGION), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );
            this.logger.info('Received response from Vidis API for activated offers by region', { data: response.data });
    }

    public async getActivatedAngeboteBySchool(kennung: string): Promise<void> {
            const token: string = await this.getAuthToken();
            const response: AxiosResponse<VidisResponse<unknown>> = await firstValueFrom(
                this.httpService.get(this.constructUrl(VidisApiService.pathGetActivatedAngeboteBySchool(this.convertKennungToVidisSchoolId(kennung))), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );
            this.logger.info('Received response from Vidis API for activated offers by school', { data: response.data });
    }

    private async getAuthToken(): Promise<string> {
        const response: AxiosResponse<{ access_token: string }> = await firstValueFrom(
            this.httpService.post(this.constructUrl(VidisApiService.PATH_GET_AUTH_TOKEN), {
                client_id: this.vidisConfig.CLIENT_ID,
                client_secret: this.vidisConfig.CLIENT_SECRET,
                grant_type: 'client_credentials',
            }),
        );
        return response.data.access_token;
    }

    private constructUrl(path:string): string {
        return `${this.vidisConfig.BASE_URL}${path}`;
    }

    private convertKennungToVidisSchoolId(kennung: string): string {
        return `${VidisApiService.PREFIX_VIDIS_SCHOOOL_ID}${kennung}`;
    }

    /*
    private convertVidisSchoolIdToKennung(vidisSchoolId: string): string {
        return vidisSchoolId.replace(`${VidisApiService.PREFIX_VIDIS_SCHOOOL_ID}`, '');
    }
        */
}
