import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export class RolleNameQueryParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The name for the role.',
        required: false,
        nullable: false,
    })
    public readonly searchStr?: string;
}
