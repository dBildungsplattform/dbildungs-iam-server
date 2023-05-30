import { IsBoolean, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { PersonGender, PersonTrustLevel } from "../person.enums";
import PersonBirthDto from "./person-birth.dto";
import PersonNameDto from "./person-name.dto";

export default class CreatePersonDto {
    @IsString()
    public referrer!: string;

    @IsOptional()
    @IsString()
    public mandant?: string;

    @ValidateNested()
    public name!: PersonNameDto;

    @ValidateNested()
    public geburt!: PersonBirthDto;

    @IsOptional()
    @IsString()
    @Matches(Object.values(PersonGender).join("|"))
    public geschlecht?: PersonGender;

    @IsOptional()
    @IsString()
    public lokalisierung = "de-DE";

    @IsOptional()
    @IsString()
    @Matches(Object.values(PersonTrustLevel).join("|"))
    public vertrauensstufe?: PersonTrustLevel;

    @IsOptional()
    @IsBoolean()
    public auskunftssperre?: boolean;
}
