import { ServiceProviderKategorie, ServiceProviderTarget } from './service-provider.enum.js';

export class ServiceProvider<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public name: string,
        public target: ServiceProviderTarget,
        public url: string | undefined,
        public kategorie: ServiceProviderKategorie,
        public providedOnSchulstrukturknoten: string,
        public logo: Buffer | undefined,
        public logoMimeType: string | undefined,
        public gruppe: string | undefined,
        public rolle: string | undefined,
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
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        gruppe: string | undefined,
        rolle: string | undefined,
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
            logo,
            logoMimeType,
            gruppe,
            rolle,
        );
    }

    public static createNew(
        name: string,
        target: ServiceProviderTarget,
        url: string | undefined,
        kategorie: ServiceProviderKategorie,
        providedOnSchulstrukturknoten: string,
        logo: Buffer | undefined,
        logoMimeType: string | undefined,
        gruppe: string | undefined,
        rolle: string | undefined,
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
            logo,
            logoMimeType,
            gruppe,
            rolle,
        );
    }
}
