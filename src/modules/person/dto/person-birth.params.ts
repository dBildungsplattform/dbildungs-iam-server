import { IsDateString, IsOptional, Length } from "class-validator";

export class PersonBirthParams {
    @IsOptional()
    @IsDateString()
    public readonly datum?: Date;

    @IsOptional()
    @Length(1, 100)
    public readonly geburtsort?: string;
}
