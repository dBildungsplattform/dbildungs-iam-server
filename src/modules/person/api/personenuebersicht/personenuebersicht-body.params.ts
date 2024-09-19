import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagedQueryParams } from '../../../../shared/paging/index.js';
import { PersonID } from '../../../../shared/types/aggregate-ids.types.js';
import { ScopeOrder } from '../../../../shared/persistence/scope.enums.js';
import { SortFieldPersonenuebersicht } from '../../domain/person.enums.js';

export class PersonenuebersichtBodyParams extends PagedQueryParams {
    @IsOptional()
    @IsEnum(ScopeOrder)
    @ApiProperty({
        enum: ScopeOrder,
        required: false,
        nullable: true,
        description: 'Order to sort by.',
    })
    public readonly sortOrder?: ScopeOrder;

    @IsOptional()
    @IsEnum(SortFieldPersonenuebersicht)
    @ApiProperty({
        enum: SortFieldPersonenuebersicht,
        required: false,
        nullable: true,
        description: 'Field to sort by.',
    })
    public readonly sortField?: SortFieldPersonenuebersicht;

    @ApiProperty({
        description: 'An array of IDs for the persons.',
        type: [String],
    })
    @IsString({ each: true })
    public readonly personIds?: PersonID[];
}
