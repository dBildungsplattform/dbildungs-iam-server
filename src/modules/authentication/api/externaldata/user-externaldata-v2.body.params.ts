import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UserExternalDataV2BodyParams {
    @IsString()
    @ApiProperty({ required: true })
    public sub!: string;

    // Eindeutiger Identifikator des Angebots, für das die Berechtigung geprüft werden soll
    @IsString()
    @ApiProperty({ required: true })
    public keycloakClient!: string;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ default: false })
    public includeEmailAddress?: boolean;
}
