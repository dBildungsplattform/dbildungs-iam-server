import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class DbiamUpdatePersonenkontexteQueryParams {

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    public readonly personalnummer?: string;
}
