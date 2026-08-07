/* v8 ignore file @preserv */
// apparently v8 does not cover empty classes like this one, even though they are used in tests, so we have to ignore this file for coverage purposes.
// is this class necessary or should we remove it? There are more like this.
import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsOptional } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';
import { ServiceProviderKategorie, ServiceProviderKategorieTypName } from '../domain/service-provider.enum.js';

export class ManageableServiceProvidersParams extends PagedQueryParams {
    @IsOptional()
    @TransformToArray()
    @IsEnum(ServiceProviderKategorie, { each: true })
    @ArrayUnique()
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
        enum: ServiceProviderKategorie,
        enumName: ServiceProviderKategorieTypName,
    })
    public readonly kategorien: ServiceProviderKategorie[] = [];
}
