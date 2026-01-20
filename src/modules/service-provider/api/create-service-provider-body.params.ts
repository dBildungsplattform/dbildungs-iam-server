import { ApiProperty } from '@nestjs/swagger';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderTarget,
} from '../domain/service-provider.enum.js';

export class CreateServiceProviderBodyParams {
    @ApiProperty()
    public organisationId!: string;

    @ApiProperty()
    public name!: string;

    @ApiProperty({ enum: ServiceProviderTarget })
    public target!: ServiceProviderTarget;

    @ApiProperty({ required: false })
    public url?: string;

    @ApiProperty({
        description: 'Organisation (Schulstrukturknoten) where the Angebot is provided',
        format: 'uuid',
    })
    public providedOnSchulstrukturknoten!: string;

    @ApiProperty({ enum: ServiceProviderKategorie })
    public kategorie!: ServiceProviderKategorie;

    @ApiProperty()
    public requires2fa!: boolean;

    @ApiProperty({ required: false })
    public vidisAngebotId?: string;

    @ApiProperty({ enum: ServiceProviderMerkmal, isArray: true })
    public merkmale!: ServiceProviderMerkmal[];
}
