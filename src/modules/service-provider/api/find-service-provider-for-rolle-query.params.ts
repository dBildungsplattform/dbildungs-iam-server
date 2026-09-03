import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';

export class FindServiceProviderForRolleQueryParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation where the service provider should be assignable on',
        required: true,
        nullable: false,
    })
    public readonly schulstrukturknotenOfRolle!: string;

    @IsOptional()
    @IsEnum(RollenArt, { each: true })
    @TransformToArray()
    @ApiProperty({
        enum: RollenArt,
        enumName: 'RollenArt',
        description: 'The rollenart of the rolle for which the service provider should be found',
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly rollenArten?: RollenArt[];
}
