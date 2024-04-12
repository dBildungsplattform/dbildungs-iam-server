import { ApiProperty } from '@nestjs/swagger';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';

export class ServiceProviderIdNameResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public name: string;

    public constructor(serviceProvider: ServiceProvider<true>) {
        this.id = serviceProvider.id;
        this.name = serviceProvider.name;
    }
}
