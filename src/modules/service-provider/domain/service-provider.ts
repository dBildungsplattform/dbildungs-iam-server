import { ServiceProviderKategorie } from './service-provider.enum.js';

export class ServiceProvider<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public name: string,
        public url: string,
        public kategorie: ServiceProviderKategorie,
        public providedOnSchulstrukturknoten: string,
        public logo: Buffer | undefined,
        public logoMimeType: string | undefined,
    ) {}

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        url: string,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
    ): ServiceProvider<WasPersisted> {
        return new ServiceProvider(
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

    public static createNew(
        name: string,
        url: string,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
    ): ServiceProvider<false> {
        return new ServiceProvider(
            undefined,
            undefined,
            undefined,
            name,
            url,
            kategorie,
            providedOnSchulstrukturknoten,
            logo,
            logoMimeType,
        );
    }
}
