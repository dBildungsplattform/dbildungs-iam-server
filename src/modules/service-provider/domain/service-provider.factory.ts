import { Injectable } from '@nestjs/common';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from './service-provider.enum.js';
import { ServiceProvider } from './service-provider.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { LogoOrLogoIdError } from './errors/logo-or-logo-id.error.js';

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
        logoId: number | undefined,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        keycloakGroup: string | undefined,
        keycloakRole: string | undefined,
        externalSystem: ServiceProviderSystem,
        requires2fa: boolean,
        vidisAngebotId: string | undefined,
        merkmale: ServiceProviderMerkmal[],
    ): Result<ServiceProvider<true>, LogoOrLogoIdError> {
        if (!this.isValidLogoCombination(logoId, logo, logoMimeType)) {
            return Err(new LogoOrLogoIdError('Cannot construct ServiceProvider with both logoId and logo'));
        }
        return Ok(
            ServiceProvider.construct(
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
            ),
        );
    }

    public createNew(
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
    ): Result<ServiceProvider<false>, LogoOrLogoIdError> {
        if (!this.isValidLogoCombination(logoId, logo, logoMimeType)) {
            return Err(new LogoOrLogoIdError('Cannot construct ServiceProvider with both logoId and logo'));
        }
        return Ok(
            ServiceProvider.createNew(
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
            ),
        );
    }

    private isValidLogoCombination(
        logoId: number | undefined,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
    ): boolean {
        if (logoId !== undefined) {
            return logo === undefined && logoMimeType === undefined;
        }
        if (logo !== undefined && logoMimeType !== undefined) {
            return logoId === undefined;
        }
        return true;
    }
}
