import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRolleBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @AutoMap()
    public name!: string;

    @IsUUID()
    @ApiProperty()
    @AutoMap()
    public administeredBySchulstrukturknoten!: string;
}
