import { Injectable } from '@nestjs/common';
import { ServiceProvider } from './service-provider.js';
import { ServiceProviderKategorie, ServiceProviderSystem, ServiceProviderTarget } from './service-provider.enum.js';

@Injectable()
export class ServiceProviderFactory {
    public construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
    ): ServiceProvider<true> {
        return ServiceProvider.construct(
            id,
            createdAt,
            updatedAt,
            name,
            target,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logo,
            logoMimeType,
            keycloakGroup,
            keycloakRole,
            externalSystem,
            requires2fa,
            vidisAngebotId,
        );
    }

    public createNew(
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
    ): ServiceProvider<false> {
        return ServiceProvider.createNew(
            name,
            target,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logo,
            logoMimeType,
            keycloakGroup,
            keycloakRole,
            externalSystem,
            requires2fa,
            vidisAngebotId,
        );
    }
}
