import { ServiceProviderKategorie } from '../../../modules/service-provider/domain/service-provider.enum.js';

export class ServiceProviderFile {
    public id!: string;

    public name!: string;

    public url!: string;

    public providedOnSchulstrukturknoten!: string;

    public kategorie!: ServiceProviderKategorie;

    public logoBase64?: string;

    public logoMimeType?: string;
}
