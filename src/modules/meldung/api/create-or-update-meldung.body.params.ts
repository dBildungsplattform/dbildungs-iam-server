import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MeldungStatus } from '../persistence/meldung.entity.js';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrUpdateMeldungBodyParams {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    public id?: string;

    @IsString()
    @ApiProperty({ required: true })
    public inhalt!: string;

    @IsEnum(MeldungStatus)
    @ApiProperty({ enum: MeldungStatus, required: true })
    public status!: MeldungStatus;

    @IsNumber()
    @ApiProperty({ required: true })
    public revision!: number;
}
