import { AutoMap } from '@automapper/classes';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

export class OrganizationQueryParams extends PagedQueryParams {

    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly kennung?: string;

    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly name?: string;

    @AutoMap()
    @IsEnum(OrganisationsTyp)
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: OrganisationsTyp,
        default: OrganisationsTyp.SONSTIGE,
    })
    public readonly typ?: OrganisationsTyp;
}
