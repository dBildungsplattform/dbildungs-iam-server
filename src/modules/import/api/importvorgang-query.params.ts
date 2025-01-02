import { PagedQueryParams } from '../../../shared/paging/index.js';
import { ArrayUnique, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';
import { ImportStatus, ImportStatusName } from '../domain/import.enums.js';

export class ImportvorgangQueryParams extends PagedQueryParams {
    @IsEnum(ImportStatus)
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: ImportStatus,
        enumName: ImportStatusName,
        default: ImportStatus.COMPLETED,
    })
    public readonly status?: ImportStatus;

    @IsOptional()
    @TransformToArray()
    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly rolleIds?: string[];

    @IsOptional()
    @TransformToArray()
    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
        description:
            'Liefert Importvorgänge mit den angegebenen IDs, selbst wenn andere Filterkriterien nicht zutreffen (ODER-verknüpft mit anderen Kriterien).',
    })
    public readonly organisationIds?: string[];
}
