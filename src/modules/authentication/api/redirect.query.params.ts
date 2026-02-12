/* v8 ignore file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RedirectQueryParams {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    public redirectUrl?: string;
}
