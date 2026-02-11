/* v8 ignore */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RedirectQueryParams {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    public redirectUrl?: string;
}
