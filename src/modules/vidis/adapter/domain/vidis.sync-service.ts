import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../../core/logging/class-logger.js';
import type { VidisDomainError } from './vidis-domain.error.js';
import type {
    VidisAngebotWithSchoolActivations,
    VidisServiceResponseSchoolActivation,
    VidisServiceResponseAngebot,
} from './vidis.types.js';
import { Organisation } from '../../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../../organisation/persistence/organisation.repository.js';
import { OrganisationScope } from '../../../organisation/persistence/organisation.scope.js';
import { ServiceProviderRepo } from '../../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../../service-provider/domain/service-provider.js';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from '../../../service-provider/domain/service-provider.enum.js';
import { IPersonPermissions } from '../../../../shared/permissions/person-permissions.interface.js';
import { EscalatedPersonPermissionsFactory } from '../../../permission/escalated-person-permissions.factory.js';
import { RollenSystemRechtEnum } from '../../../rolle/domain/systemrecht.js';
import { RollenerweiterungRepo } from '../../../rolle/repo/rollenerweiterung.repo.js';
import { ServerConfig, VidisConfig } from '../../../../shared/config/index.js';
import { ConfigService } from '@nestjs/config';
import { VidisApiAdapter } from './vidis-api.adapter.js';

type VidisSchoolActivatedAngebot = {
    angebot: VidisServiceResponseAngebot;
    date: string;
};

type VidisAngeboteByOrganisationId = Record<string, VidisSchoolActivatedAngebot[]>;
type VidisOrganisationIdByKennung = Record<string, string>;
type DecodedVidisLogo = {
    logo: Buffer | undefined;
    logoMimeType: string | undefined;
};

@Injectable()
export class VidisSyncService {
    private static readonly PNG_FILE_SIGNATURE: Buffer = Buffer.from('89504e470d0a1a0a', 'hex');
    private static readonly JPEG_FILE_SIGNATURE: Buffer = Buffer.from('ffd8ff', 'hex');
    private static readonly WEBP_RIFF_SIGNATURE: Buffer = Buffer.from('RIFF');
    private static readonly WEBP_FILE_SIGNATURE: Buffer = Buffer.from('WEBP');
    private static readonly DEFAULT_VIDIS_SERVICE_PROVIDER_MERKMALE: ServiceProviderMerkmal[] = [
        ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
        ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
    ];

    private readonly vidisConfig: VidisConfig;

    public constructor(
        private readonly vidisApiAdapter: VidisApiAdapter,
        private readonly organisationRepo: OrganisationRepository,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly escalatedPersonPermissionsFactory: EscalatedPersonPermissionsFactory,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
        private readonly logger: ClassLogger,
        configService: ConfigService<ServerConfig>,
    ) {
        this.vidisConfig = configService.getOrThrow<VidisConfig>('VIDIS');
    }

    public async sync(): Promise<void> {
        const activatedAngebote: Result<VidisAngebotWithSchoolActivations[], VidisDomainError> =
            await this.vidisApiAdapter.getActivatedAngeboteByRegionSH();

        if (!activatedAngebote.ok) {
            this.logger.debug('Skipping VIDIS sync because loading activated Angebote failed');
            return;
        }

        const permissions: IPersonPermissions = this.escalatedPersonPermissionsFactory.createNew([
            {
                orgaId: 'ROOT',
                systemrechte: [RollenSystemRechtEnum.ANGEBOTE_VERWALTEN, RollenSystemRechtEnum.ROLLEN_ERWEITERN],
            },
        ]);

        await this.syncSchoolsPage(activatedAngebote.value, 0, permissions);
    }

    private async syncSchoolsPage(
        activatedAngebote: VidisAngebotWithSchoolActivations[],
        schoolOffset: number,
        permissions: IPersonPermissions,
    ): Promise<void> {
        const [schools, total]: Counted<Organisation<true>> = await this.organisationRepo.findBy(
            new OrganisationScope()
                .findBy({
                    typ: 'SCHULE',
                })
                .paged(schoolOffset, this.vidisConfig.SYNC_SCHOOLS_PAGE_SIZE),
        );

        if (schools.length === 0) {
            return;
        }

        const organisationIdByKennung: VidisOrganisationIdByKennung = this.mapOrganisationIdsByKennung(schools);
        const angeboteByOrganisationId: VidisAngeboteByOrganisationId = this.groupAngeboteByOrganisationId(
            activatedAngebote,
            organisationIdByKennung,
        );
        const vidisAngeboteForSchools: ServiceProvider<true>[] =
            await this.serviceProviderRepo.findVidisAngeboteforSchools(Object.values(organisationIdByKennung));

        await Promise.all(
            Object.keys(angeboteByOrganisationId).map((organisationId: string) => {
                const angebote: VidisSchoolActivatedAngebot[] = angeboteByOrganisationId[organisationId] ?? [];
                return this.syncForSchoolInternal(
                    organisationId,
                    angebote,
                    vidisAngeboteForSchools.filter(
                        (sp: ServiceProvider<true>) => sp.providedOnSchulstrukturknoten === organisationId,
                    ),
                    permissions,
                );
            }),
        );

        const nextSchoolOffset: number = schoolOffset + this.vidisConfig.SYNC_SCHOOLS_PAGE_SIZE;
        if (nextSchoolOffset >= total) {
            return;
        }

        return this.syncSchoolsPage(activatedAngebote, nextSchoolOffset, permissions);
    }

    private syncForSchoolInternal(
        organisationId: string,
        angeboteInVidis: VidisSchoolActivatedAngebot[],
        angeboteInDb: ServiceProvider<true>[],
        permissions: IPersonPermissions,
    ): Promise<void> {
        this.logger.info(`Syncing VIDIS Angebote for school with organisationId: ${organisationId}`);
        const vidisAngebotIds: Set<string> = new Set(
            angeboteInVidis.map(({ angebot }: VidisSchoolActivatedAngebot) => angebot.offerId.toString()),
        );

        const existingVidisAngebotIdsInDb: Set<string> = new Set(
            angeboteInDb
                .map((angebotInDb: ServiceProvider<true>) => angebotInDb.vidisAngebotId)
                .filter((vidisAngebotId: string | undefined): vidisAngebotId is string => vidisAngebotId !== undefined),
        );

        const missingAngeboteInDb: VidisSchoolActivatedAngebot[] = angeboteInVidis.filter(
            ({ angebot }: VidisSchoolActivatedAngebot) => !existingVidisAngebotIdsInDb.has(angebot.offerId.toString()),
        );
        const serviceProviderIdsMissingInVidis: string[] = angeboteInDb
            .filter(
                (angebotInDb: ServiceProvider<true>) =>
                    angebotInDb.vidisAngebotId !== undefined && !vidisAngebotIds.has(angebotInDb.vidisAngebotId),
            )
            .map((angebotInDb: ServiceProvider<true>) => angebotInDb.id);

        if (missingAngeboteInDb.length === 0 && serviceProviderIdsMissingInVidis.length === 0) {
            this.logger.info(
                `No differences between VIDIS API and database for school with organisationId: ${organisationId}`,
            );
            return Promise.resolve();
        }
        this.logger.info(
            `Differences found between VIDIS API and database for school with organisationId: ${organisationId}. ` +
                `VIDIS Angebote to add to DB: [${missingAngeboteInDb
                    .map(
                        ({ angebot }: VidisSchoolActivatedAngebot) =>
                            `${angebot.offerId} (${angebot.offerTitle.toString().substring(0, 50)})`,
                    )
                    .join(', ')}]. ` +
                `VIDIS Angebote to remove from DB: [${angeboteInDb
                    .filter(
                        (angebotInDb: ServiceProvider<true>) =>
                            angebotInDb.vidisAngebotId !== undefined &&
                            !vidisAngebotIds.has(angebotInDb.vidisAngebotId),
                    )
                    .map(
                        (angebotInDb: ServiceProvider<true>) =>
                            `${angebotInDb.vidisAngebotId} (${angebotInDb.name.substring(0, 50)})`,
                    )
                    .join(', ')}]`,
        );

        const syncOperations: Promise<unknown>[] = missingAngeboteInDb.map(({ angebot }: VidisSchoolActivatedAngebot) =>
            this.serviceProviderRepo.create(permissions, this.createVidisServiceProvider(organisationId, angebot)),
        );

        if (serviceProviderIdsMissingInVidis.length > 0) {
            syncOperations.push(
                this.rollenerweiterungRepo.deleteByOrganisationIdAndServiceProviderIds(
                    organisationId,
                    serviceProviderIdsMissingInVidis,
                    permissions,
                ),
            );
            syncOperations.push(
                ...serviceProviderIdsMissingInVidis.map((serviceProviderId: string) =>
                    this.serviceProviderRepo.deleteByIdAuthorized(permissions, serviceProviderId),
                ),
            );
        }

        return Promise.allSettled(syncOperations).then((results: PromiseSettledResult<unknown>[]) => {
            const failedOperations: PromiseSettledResult<unknown>[] = results.filter(
                (result: PromiseSettledResult<unknown>) =>
                    result.status === 'rejected' ||
                    (result.status === 'fulfilled' &&
                        typeof result.value === 'object' &&
                        result.value !== null &&
                        'ok' in result.value &&
                        result.value.ok === false),
            );

            if (failedOperations.length === 0) {
                return;
            }

            this.logger.error(
                `VIDIS sync for organisation ${organisationId} finished with ${failedOperations.length} failed operations.`,
            );

            failedOperations.forEach((result: PromiseSettledResult<unknown>) => {
                if (result.status === 'rejected') {
                    this.logger.logUnknownAsError(
                        `VIDIS sync operation for organisation ${organisationId} rejected`,
                        result.reason,
                    );
                    return;
                }

                const failedResult: unknown = result.value;
                const error: unknown =
                    typeof failedResult === 'object' && failedResult !== null && 'error' in failedResult
                        ? failedResult.error
                        : failedResult;

                this.logger.logUnknownAsError(
                    `VIDIS sync operation for organisation ${organisationId} returned an error result`,
                    error,
                    false,
                );
            });
        });
    }

    private createVidisServiceProvider(
        organisationId: string,
        angebot: VidisServiceResponseAngebot,
    ): ServiceProvider<false> {
        const { logo, logoMimeType }: DecodedVidisLogo = VidisSyncService.decodeVidisLogo(angebot.offerLogo);

        return ServiceProvider.createNew(
            angebot.offerTitle.toString(),
            ServiceProviderTarget.URL,
            angebot.offerLink,
            ServiceProviderKategorie.SCHULISCH,
            organisationId,
            undefined,
            logo,
            logoMimeType,
            undefined,
            undefined,
            ServiceProviderSystem.NONE,
            false,
            angebot.offerId.toString(),
            VidisSyncService.DEFAULT_VIDIS_SERVICE_PROVIDER_MERKMALE,
        );
    }

    private static decodeVidisLogo(offerLogo: string): DecodedVidisLogo {
        if (!offerLogo) {
            return { logo: undefined, logoMimeType: undefined };
        }

        const trimmedLogo: string = offerLogo.trim();
        const dataUriMatch: RegExpMatchArray | null = trimmedLogo.match(
            /^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/u,
        );
        const encodedLogo: string = dataUriMatch?.[2] ?? trimmedLogo;
        const logo: Buffer = Buffer.from(encodedLogo, 'base64');

        if (logo.length === 0) {
            return { logo: undefined, logoMimeType: undefined };
        }

        const logoMimeType: string | undefined = dataUriMatch?.[1] ?? VidisSyncService.detectLogoMimeType(logo);
        if (!logoMimeType) {
            return { logo: undefined, logoMimeType: undefined };
        }

        return { logo, logoMimeType };
    }

    private static detectLogoMimeType(logo: Buffer): string | undefined {
        if (logo.subarray(0, VidisSyncService.PNG_FILE_SIGNATURE.length).equals(VidisSyncService.PNG_FILE_SIGNATURE)) {
            return 'image/png';
        }

        if (
            logo.subarray(0, VidisSyncService.JPEG_FILE_SIGNATURE.length).equals(VidisSyncService.JPEG_FILE_SIGNATURE)
        ) {
            return 'image/jpeg';
        }

        if (
            logo
                .subarray(0, VidisSyncService.WEBP_RIFF_SIGNATURE.length)
                .equals(VidisSyncService.WEBP_RIFF_SIGNATURE) &&
            logo
                .subarray(8, 8 + VidisSyncService.WEBP_FILE_SIGNATURE.length)
                .equals(VidisSyncService.WEBP_FILE_SIGNATURE)
        ) {
            return 'image/webp';
        }

        const logoAsText: string = logo.toString('utf8').trimStart();
        if (logoAsText.startsWith('<svg') || (logoAsText.startsWith('<?xml') && logoAsText.includes('<svg'))) {
            return 'image/svg+xml';
        }

        return undefined;
    }

    private mapOrganisationIdsByKennung(schools: Organisation<true>[]): VidisOrganisationIdByKennung {
        return schools.reduce((organisationIdByKennung: VidisOrganisationIdByKennung, school: Organisation<true>) => {
            if (school.kennung) {
                organisationIdByKennung[school.kennung] = school.id;
            }

            return organisationIdByKennung;
        }, {});
    }

    private groupAngeboteByOrganisationId(
        activatedAngebote: VidisAngebotWithSchoolActivations[],
        organisationIdByKennung: VidisOrganisationIdByKennung,
    ): VidisAngeboteByOrganisationId {
        const angeboteByOrganisationId: VidisAngeboteByOrganisationId = {};

        activatedAngebote.forEach((angebotWithSchoolActivations: VidisAngebotWithSchoolActivations) => {
            angebotWithSchoolActivations.schoolActivations.forEach(
                (schoolActivation: VidisServiceResponseSchoolActivation) => {
                    const organisationId: string | undefined = organisationIdByKennung[schoolActivation.kennung];
                    if (!organisationId) {
                        return;
                    }

                    const schoolAngebote: VidisSchoolActivatedAngebot[] =
                        angeboteByOrganisationId[organisationId] ?? [];

                    schoolAngebote.push({
                        angebot: angebotWithSchoolActivations.angebot,
                        date: schoolActivation.date,
                    });

                    angeboteByOrganisationId[organisationId] = schoolAngebote;
                },
            );
        });

        return angeboteByOrganisationId;
    }
}
