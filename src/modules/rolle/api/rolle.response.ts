import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';

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

    @ApiProperty({ enum: RollenArt })
    @AutoMap(() => String)
    public rollenart!: RollenArt;

    @ApiProperty({ enum: RollenMerkmal, isArray: true, uniqueItems: true })
    @AutoMap(() => [String])
    public merkmale!: RollenMerkmal[];
}
