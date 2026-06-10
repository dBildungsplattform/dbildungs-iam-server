import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { VidisConfig } from '../../../../shared/config/vidis.config.js';
import { ServerConfig } from '../../../../shared/config/server.config.js';
import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import {
    VidisApiResponseAngebotByRegion,
    VidisApiResponse,
    VidisServiceResponseAngebot,
    VidisApiResponseSchoolActivation,
    VidisApiResponseAngebotBySchool,
    VidisAngebotWithSchoolActivations,
} from '../domain/vidis.types.js';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces.js';
import { firstValueFrom } from 'rxjs';
import { Err, Ok } from '../../../../shared/util/result.js';
import { VidisDomainError } from '../../error/vidis-domain.error.js';

@Injectable()
export class VidisApiAdapter {
    private readonly vidisConfig: VidisConfig;

    private static readonly PREFIX_VIDIS_SCHOOOL_ID: string = 'DE-SH-';

    private static readonly PATH_GET_AUTH_TOKEN: string = '/o/oauth2/token';

    private static readonly PATH_GET_ACTIVATED_ANGEBOTE_BY_SCHOOL = (vidisSchoolId: string): string =>
        `/o/vidis-rest/v1.0/offers/activated/by-school/${vidisSchoolId}`;

    public constructor(
        private readonly httpService: HttpService,
        configService: ConfigService<ServerConfig>,
        private readonly logger: ClassLogger,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
    }

    public async getActivatedAngeboteByRegionSH(): Promise<
        Result<VidisAngebotWithSchoolActivations[], VidisDomainError>
    > {
        try {
            const token: string = await this.getAuthToken();
            const response: AxiosResponse<VidisApiResponse<VidisApiResponseAngebotByRegion>> = await firstValueFrom(
                this.httpService.get(this.constructUrl(this.getActivatedAngeboteByRegionPath(), true), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );
            if (response.status < 200 || response.status >= 300) {
                this.logger.error(
                    `Failed to fetch activated Angebote for region Schleswig-Holstein from Vidis API. Status code: ${response.status}, Response data: ${JSON.stringify(response.data)}`,
                );
                return Err(
                    new VidisDomainError(
                        'Failed to fetch activated Angebote for region Schleswig-Holstein from Vidis API',
                    ),
                );
            }
            const result: VidisAngebotWithSchoolActivations[] = response.data.items.map(
                (item: VidisApiResponseAngebotByRegion) => {
                    const {
                        schoolActivations,
                        ...angebotWithoutSchoolActivations
                    }: {
                        schoolActivations: VidisApiResponseSchoolActivation[];
                    } & Omit<VidisApiResponseAngebotByRegion, 'schoolActivations'> = item;

                    return {
                        angebot: {
                            ...angebotWithoutSchoolActivations,
                        },
                        schoolActivations: schoolActivations.map((sa: VidisApiResponseSchoolActivation) => ({
                            date: sa.date,
                            kennung: this.convertVidisSchoolIdToKennung(sa.regionName),
                        })),
                    } satisfies VidisAngebotWithSchoolActivations;
                },
            );

            this.logger.debug(
                `Fetched ${result.length} activated Angebote for region Schleswig-Holstein from Vidis API`,
            );
            return Ok(result);
        } catch (error) {
            this.logger.error(
                `Error while fetching activated Angebote for region Schleswig-Holstein from Vidis API: ${JSON.stringify(error)}`,
            );
            return Err(
                new VidisDomainError(
                    `Error while fetching activated Angebote for region Schleswig-Holstein from Vidis API`,
                ),
            );
        }
    }

    public async getActivatedAngeboteBySchool(
        kennung: string,
    ): Promise<Result<VidisServiceResponseAngebot[], VidisDomainError>> {
        try {
            const token: string = await this.getAuthToken();
            const response: AxiosResponse<VidisApiResponse<VidisApiResponseAngebotBySchool>> = await firstValueFrom(
                this.httpService.get(
                    this.constructUrl(
                        VidisApiAdapter.PATH_GET_ACTIVATED_ANGEBOTE_BY_SCHOOL(
                            this.convertKennungToVidisSchoolId(kennung),
                        ),
                        true,
                    ),
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                ),
            );
            if (response.status < 200 || response.status >= 300) {
                this.logger.error(
                    `Failed to fetch activated Angebote for school with kennung ${kennung} from Vidis API. Status code: ${response.status}, Response data: ${JSON.stringify(response.data)}`,
                );
                return Err(
                    new VidisDomainError(
                        `Failed to fetch activated Angebote for school with kennung ${kennung} from Vidis API`,
                    ),
                );
            }
            const result: VidisServiceResponseAngebot[] = response.data.items.map(
                (item: VidisApiResponseAngebotBySchool) =>
                    ({
                        ...item,
                    }) satisfies VidisServiceResponseAngebot,
            );

            this.logger.debug(
                `Fetched ${result.length} activated Angebote for school with kennung ${kennung} from Vidis API`,
            );
            return Ok(result);
        } catch (error) {
            this.logger.error(
                `Error while fetching activated Angebote for school with kennung ${kennung} from Vidis API: ${JSON.stringify(error)}`,
            );
            return Err(
                new VidisDomainError(
                    `Error while fetching activated Angebote for school with kennung ${kennung} from Vidis API`,
                ),
            );
        }
    }

    //***BELOW ONLY PRIVATE HELPERS***

    private async getAuthToken(): Promise<string> {
        const body: URLSearchParams = new URLSearchParams({
            client_id: this.vidisConfig.CLIENT_ID,
            client_secret: this.vidisConfig.CLIENT_SECRET,
            grant_type: 'client_credentials',
        });

        const response: AxiosResponse<{ access_token: string }> = await firstValueFrom(
            this.httpService.post(this.constructUrl(VidisApiAdapter.PATH_GET_AUTH_TOKEN, false), body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }),
        );

        this.logger.debug(`Received auth token from Vidis API`);
        return response.data.access_token;
    }

    private constructUrl(path: string, withMaxPageSize: boolean): string {
        return `${this.vidisConfig.BASE_URL}${path}${withMaxPageSize ? '?pageSize=100000' : ''}`; //Since we will never have 100000 Angebote, we can set pageSize to a very high number to avoid pagination and multiple requests to the Vidis API. This simplifies the implementation and testing of our service.
    }

    private getActivatedAngeboteByRegionPath(): string {
        return `/o/vidis-rest/v1.0/offers/activated/by-region/${encodeURIComponent(this.vidisConfig.REGION)}`;
    }

    private convertKennungToVidisSchoolId(kennung: string): string {
        return `${VidisApiAdapter.PREFIX_VIDIS_SCHOOOL_ID}${kennung}`;
    }

    private convertVidisSchoolIdToKennung(vidisSchoolId: string): string {
        return vidisSchoolId.replace(`${VidisApiAdapter.PREFIX_VIDIS_SCHOOOL_ID}`, '');
    }
}
