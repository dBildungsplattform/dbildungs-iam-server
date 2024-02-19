import { ApiProperty } from '@nestjs/swagger';

export class ServiceProviderResponse {
    @ApiProperty()
    public id!: string;

    @ApiProperty()
    public name!: string;

    @ApiProperty()
    public url!: string;
}
