import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePersonMigrationBodyParams {
    @IsString()
    @ApiProperty({ required: true })
    public readonly personId!: string;

    @IsString()
    @ApiProperty({ required: true })
    public readonly familienname!: string;

    @IsString()
    @ApiProperty({ required: true })
    public readonly vorname!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly hashedPassword!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly username!: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly personalnummer?: string;
}
