import { ServiceProviderKategorie } from './service-provider.enum.js';

export class ServiceProvider<WasPersisted extends boolean, WithLogo extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public name: string,
        public url: string,
        public kategorie: ServiceProviderKategorie,
        public logoMimeType: string,
        public logo: Persisted<Buffer, WithLogo>,
        public providedOnSchulstrukturknoten: string,
    ) {}

    public static createNew(
        name: string,
        url: string,
        kategorie: ServiceProviderKategorie,
        logoMimeType: string,
        logo: Buffer,
        providedOnSchulstrukturknoten: string,
    ): ServiceProvider<false, true> {
        return new ServiceProvider(
            undefined,
            undefined,
            undefined,
            name,
            url,
            kategorie,
            logoMimeType,
            logo,
            providedOnSchulstrukturknoten,
        );
    }

    public static construct<WasPersisted extends boolean = false, WithLogo extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        url: string,
        kategorie: ServiceProviderKategorie,
        logoMimeType: string,
        logo: Persisted<Buffer, WithLogo>,
        providedOnSchulstrukturknoten: string,
    ): ServiceProvider<WasPersisted, WithLogo> {
        return new ServiceProvider(
            id,
            createdAt,
            updatedAt,
            name,
            url,
            kategorie,
            logoMimeType,
            logo,
            providedOnSchulstrukturknoten,
        );
    }
}
