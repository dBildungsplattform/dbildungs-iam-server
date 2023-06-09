import { AutoMap } from '@automapper/classes';
import { Expose, Type } from 'class-transformer';
import { IsDateString, IsOptional, Length } from 'class-validator';

export class PersonBirthParams {
    @AutoMap()
    @IsOptional()
    @IsDateString()
    @Expose({ name: 'datum' })
    @Type(() => Date)
    public readonly date?: Date;

    @AutoMap()
    @IsOptional()
    @Length(1, 100)
    @Expose({ name: 'geburtsort' })
    public readonly place?: string;
}
