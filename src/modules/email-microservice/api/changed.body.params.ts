import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class EmailChangedBodyParams {
    @IsUUID()
    @ApiProperty()
    public spshPersonId!: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    public previousPrimaryEmail?: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    public previousAlternativeEmail?: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    public newPrimaryEmail?: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    public newAlternativeEmail?: string;
}
