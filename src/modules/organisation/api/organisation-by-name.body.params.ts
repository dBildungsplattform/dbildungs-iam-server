import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OrganisationByNameBodyParams {
    @IsString()
    @ApiProperty({ required: true })
    public readonly name!: string;
}
