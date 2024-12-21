import { PagedQueryParams } from '../../../shared/paging/index.js';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportResultQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsUUID()
    @ApiProperty({
        required: true,
        nullable: false,
        description:
            'Liefert importierte Nutzerdaten für die angegebene ID, selbst wenn andere Filterkriterien nicht zutreffen (ODER-verknüpft mit anderen Kriterien).',
    })
    public readonly importvorgangId!: string;
}
