import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class RolleResponse {
    @ApiProperty()
    @AutoMap()
    public id!: string;

    @ApiProperty()
    @AutoMap()
    public createdAt!: Date;

    @ApiProperty()
    @AutoMap()
    public updatedAt!: Date;

    @ApiProperty()
    @AutoMap()
    public name!: string;

    @ApiProperty()
    @AutoMap()
    public administeredBySchulstrukturknoten!: string;
}
