import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class PersonBirthParams {
    @AutoMap()
    @IsOptional()
    @IsDate()
    @Expose({ name: 'datum' })
    @Type(() => Date)
    @ApiProperty({ name: 'datum', required: false })
    public readonly date?: Date;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'geburtsort' })
    @ApiProperty({ name: 'geburtsort', required: false })
    public readonly place?: string;
}
