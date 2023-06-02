import { IsBoolean, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { PersonGender, PersonTrustLevel } from "../person.enums.js";
import { PersonBirthParams } from "./person-birth.params.js";
import { PersonNameParams } from "./person-name.params.js";

export class CreatePersonBodyParams {
    @IsString()
    public readonly referrer!: string;

    @IsOptional()
    @IsString()
    public readonly mandant?: string;

    @ValidateNested()
    public readonly name!: PersonNameParams;

    @ValidateNested()
    public readonly geburt!: PersonBirthParams;

    @IsOptional()
    @IsString()
    @Matches(Object.values(PersonGender).join("|"))
    public readonly geschlecht?: PersonGender;

    @IsOptional()
    @IsString()
    public readonly lokalisierung = "de-DE";

    @IsOptional()
    @IsString()
    @Matches(Object.values(PersonTrustLevel).join("|"))
    public readonly vertrauensstufe?: PersonTrustLevel;

    @IsOptional()
    @IsBoolean()
    public readonly auskunftssperre?: boolean;
}
