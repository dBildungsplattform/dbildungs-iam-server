import { assignSameKey } from '../../../shared/util/object-utils.js';
import { LogoOrLogoIdError } from './errors/logo-or-logo-id.error.js';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from './service-provider.enum.js';

export class ServiceProvider<WasPersisted extends boolean> {
    protected static readonly SAFE_UPDATE_FIELDS: (keyof ServiceProvider<false>)[] = [
        'name',
        'url',
        'kategorie',
        'logoId',
    ];

    protected constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public name: string,
        public target: ServiceProviderTarget,
        public url: string | undefined,
        public kategorie: ServiceProviderKategorie,
        public providedOnSchulstrukturknoten: string,
        public logoId: number | undefined,
        public logo: Buffer | undefined,
        public logoMimeType: string | undefined,
        public keycloakGroup: string | undefined,
        public keycloakRole: string | undefined,
        public externalSystem: ServiceProviderSystem,
        public requires2fa: boolean,
        public vidisAngebotId: string | undefined,
        public merkmale: ServiceProviderMerkmal[],
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logoId: number | undefined,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
        merkmale: ServiceProviderMerkmal[],
    ): ServiceProvider<WasPersisted> {
        return new ServiceProvider(
            id,
            createdAt,
            updatedAt,
            name,
            target,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logoId,
            logo,
            logoMimeType,
            keycloakGroup,
            keycloakRole,
            externalSystem,
            requires2fa,
            vidisAngebotId,
            merkmale,
        );
    }

    public static createNew(
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logoId: number | undefined,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
        merkmale: ServiceProviderMerkmal[],
    ): ServiceProvider<false> {
        return new ServiceProvider(
            undefined,
            undefined,
            undefined,
            name,
            target,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logoId,
            logo,
            logoMimeType,
            keycloakGroup,
            keycloakRole,
            externalSystem,
            requires2fa,
            vidisAngebotId,
            merkmale,
        );
    }

    public updateWithSafeFields(update: Partial<ServiceProvider<boolean>>): Option<LogoOrLogoIdError> {
        if (update.logoId !== undefined && this.logo !== undefined) {
            return new LogoOrLogoIdError('Cannot update logoId, if there already is a logo');
        }
        for (const field of ServiceProvider.SAFE_UPDATE_FIELDS) {
            if (update[field] !== undefined) {
                assignSameKey(this, update, field);
            }
        }
        return;
    }
}
