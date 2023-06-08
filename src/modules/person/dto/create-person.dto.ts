import { AutoMap } from '@automapper/classes';
import { PersonGender, PersonTrustLevel } from '../person.enums';

export class CreatePersonDTO {
    @AutoMap()
    public readonly referrer!: string;

    @AutoMap()
    public readonly client?: string;

    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    public readonly name!: PersonNameParams;

    @AutoMap()
    public readonly birthDate?: Date;

    @AutoMap()
    public readonly birthPlace?: string;

    @AutoMap()
    public readonly gender?: PersonGender;

    @AutoMap()
    public readonly localization = 'de-DE';

    @AutoMap()
    public readonly trustLevel?: PersonTrustLevel;

    @AutoMap()
    public readonly isActive?: boolean;
}
