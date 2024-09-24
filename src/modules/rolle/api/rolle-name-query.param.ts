import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AutoMap } from '@automapper/classes';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { RollenSort } from '../domain/rolle.enums.js';

export class RolleNameQueryParams extends PagedQueryParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The name for the role.',
        required: false,
        nullable: false,
    })
    public readonly searchStr?: string;

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
    @IsEnum(RollenSort)
    @ApiProperty({
        enum: RollenSort,
        required: false,
        nullable: true,
        description: 'Field to sort by.',
    })
    public readonly sortField?: RollenSort;
}
