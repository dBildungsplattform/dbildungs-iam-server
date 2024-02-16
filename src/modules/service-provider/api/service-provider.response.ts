import { ApiProperty } from '@nestjs/swagger';

import { ServiceProviderKategorie } from '../domain/service-provider.enum.js';
import { ServiceProvider } from '../domain/service-provider.js';

export class ServiceProviderResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public name: string;

    @ApiProperty()
    public url: string;

    @ApiProperty({ enum: ServiceProviderKategorie, enumName: 'ServiceProviderKategorie' })
    public kategorie: ServiceProviderKategorie;

    @ApiProperty()
    public hasLogo: boolean;

    public constructor(serviceProvider: ServiceProvider<true>) {
        this.id = serviceProvider.id;
        this.name = serviceProvider.name;
        this.url = serviceProvider.url;
        this.kategorie = serviceProvider.kategorie;
        this.hasLogo = !!(serviceProvider.logo && serviceProvider.logoMimeType);
    }
}
