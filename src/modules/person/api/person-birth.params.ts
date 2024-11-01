import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class PersonBirthParams {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ required: false })
    public readonly datum?: Date;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly geburtsort?: string;
}
