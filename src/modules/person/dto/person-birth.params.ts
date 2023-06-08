import { AutoMap } from '@automapper/classes';
import { IsDateString, IsOptional, Length } from 'class-validator';

export class PersonBirthParams {
    @AutoMap()
    @IsOptional()
    @IsDateString()
    public readonly datum?: Date;

    @AutoMap()
    @IsOptional()
    @Length(1, 100)
    public readonly geburtsort?: string;
}
