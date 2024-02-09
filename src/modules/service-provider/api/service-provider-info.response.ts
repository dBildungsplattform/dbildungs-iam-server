import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceProviderInfoResponse {
    @AutoMap()
    @ApiProperty()
    public id!: string;

    @AutoMap()
    @ApiProperty()
    public name!: string;

    @AutoMap()
    @ApiProperty()
    public url!: string;
}
