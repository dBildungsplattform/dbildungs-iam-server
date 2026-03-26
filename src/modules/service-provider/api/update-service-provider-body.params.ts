import { ApiProperty } from '@nestjs/swagger';
import { ServiceProviderKategorie } from '../domain/service-provider.enum.js';
import { IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { IsDIN91379AEXT } from '../../../shared/util/din-91379-validation.js';
import { ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';

export class UpdateServiceProviderBodyParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of the serviceProvider',
        required: true,
        nullable: false,
    })
    public serviceProviderId!: ServiceProviderID;

    @ApiProperty({ required: true })
    @IsDIN91379AEXT()
    @MaxLength(50)
    public name!: string;

    @ApiProperty({ required: true })
    public url!: string;

    @ApiProperty({
        required: false,
        description: 'The id of the logo',
    })
    @IsOptional()
    public logoId?: string;

    @ApiProperty({
        required: false,
        enum: ServiceProviderKategorie,
    })
    @IsEnum(ServiceProviderKategorie)
    public kategorie?: ServiceProviderKategorie;
}
