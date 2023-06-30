import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PersonBirthParams {
    @AutoMap()
    @IsOptional()
    @IsDateString()
    @Expose({ name: 'datum' })
    @Type(() => Date)
    @ApiProperty({ name: 'datum' })
    public readonly date?: Date;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'geburtsort' })
    @ApiProperty({ name: 'geburtsort' })
    public readonly place?: string;
}
