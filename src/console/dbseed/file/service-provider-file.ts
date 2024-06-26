import {
    ServiceProviderKategorie,
    ServiceProviderTarget,
} from '../../../modules/service-provider/domain/service-provider.enum.js';

export class ServiceProviderFile {
    public id!: number;

    public name!: string;

    public target!: ServiceProviderTarget;

    public url?: string;

    public providedOnSchulstrukturknoten!: number;

    public kategorie!: ServiceProviderKategorie;

    public logoBase64?: string;

    public logoMimeType?: string;

    public keycloakGroup?: string;

    public keycloakRole?: string;
}
