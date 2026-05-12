import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { VidisConfig } from '../../../shared/config/vidis.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { VidisApiResponseAngebotByRegion, VidisApiResponse, VidisServiceResponseAngebot, VidisApiResponseSchoolActivation, VidisApiResponseAngebotBySchool, VidisAngebotWithSchoolActivations } from '../api/vidis-angebote-api.types.js';
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


    public async getActivatedAngeboteByRegion(): Promise<VidisAngebotWithSchoolActivations []> {
            const token: string = await this.getAuthToken();
            const response: AxiosResponse<VidisApiResponse<VidisApiResponseAngebotByRegion>> = await firstValueFrom(
                this.httpService.get(this.constructUrl(VidisApiService.PATH_GET_ACTIVATED_ANGEBOTE_BY_REGION), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );
            const result: VidisAngebotWithSchoolActivations [] = response.data.items.map((item: VidisApiResponseAngebotByRegion) => ({
                angebot:{
                    ...item
                },
                schoolActivations: item.schoolActivations.map((sa: VidisApiResponseSchoolActivation) => (
                    {
                        date: sa.date,
                        kennung: this.convertVidisSchoolIdToKennung(sa.regionName),
                    }
                )),
            } satisfies VidisAngebotWithSchoolActivations));

            this.logger.debug(`Fetched ${result.length} activated Angebote for region Schleswig-Holstein from Vidis API`);
            return result;

    }

    public async getActivatedAngeboteBySchool(kennung: string): Promise<VidisServiceResponseAngebot []> {
            const token: string = await this.getAuthToken();
            const response: AxiosResponse<VidisApiResponse<VidisApiResponseAngebotBySchool>> = await firstValueFrom(
                this.httpService.get(this.constructUrl(VidisApiService.pathGetActivatedAngeboteBySchool(this.convertKennungToVidisSchoolId(kennung))), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );
            const result: VidisServiceResponseAngebot [] = response.data.items.map((item: VidisApiResponseAngebotBySchool) => ({
                ...item,
            } satisfies VidisServiceResponseAngebot));

            this.logger.debug(`Fetched ${result.length} activated Angebote for school with kennung ${kennung} from Vidis API`);
            return result;
    }


    private async getAuthToken(): Promise<string> {
    const body: URLSearchParams = new URLSearchParams({
        client_id: this.vidisConfig.CLIENT_ID,
        client_secret: this.vidisConfig.CLIENT_SECRET,
        grant_type: 'client_credentials',
    });

    const response: AxiosResponse<{ access_token: string }> =
        await firstValueFrom(
        this.httpService.post(
            this.constructUrl(VidisApiService.PATH_GET_AUTH_TOKEN),
            body.toString(),
            {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            },
        ),
        );

    this.logger.debug(`Received auth token from Vidis API`);
    return response.data.access_token;
    }

    private constructUrl(path:string): string {
        return `${this.vidisConfig.BASE_URL}${path}?pageSize=100000`;
    }

    private convertKennungToVidisSchoolId(kennung: string): string {
        return `${VidisApiService.PREFIX_VIDIS_SCHOOOL_ID}${kennung}`;
    }


    private convertVidisSchoolIdToKennung(vidisSchoolId: string): string {
        return vidisSchoolId.replace(`${VidisApiService.PREFIX_VIDIS_SCHOOOL_ID}`, '');
    }

}
