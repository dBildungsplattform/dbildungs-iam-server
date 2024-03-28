import { Injectable } from '@nestjs/common';
import { ServiceProvider } from './service-provider.js';
import { ServiceProviderKategorie } from './service-provider.enum.js';

@Injectable()
export class ServiceProviderFactory {
    public construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        url: string,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
    ): ServiceProvider<true> {
        return ServiceProvider.construct(
            id,
            createdAt,
            updatedAt,
            name,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logo,
            logoMimeType,
        );
    }

    public createNew(
        name: string,
        url: string,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
    ): ServiceProvider<false> {
        return ServiceProvider.createNew(name, url, kategorie, providedOnSchulstrukturknoten, logo, logoMimeType);
    }
}
