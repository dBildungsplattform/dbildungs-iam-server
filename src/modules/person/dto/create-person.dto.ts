import { AutoMap } from '@automapper/classes';
import { PersonGender, PersonTrustLevel } from '../person.enums';

export class CreatePersonDTO {
    @AutoMap()
    public readonly referrer!: string;

    @AutoMap()
    public readonly client?: string;

    @AutoMap()
    public readonly lastName!: string;

    @AutoMap()
    public readonly firstName!: string;

    @AutoMap()
    public readonly initialLastName?: string;

    @AutoMap()
    public readonly nickName?: string;

    @AutoMap()
    public readonly nameTitle?: string;

    @AutoMap()
    public readonly nameSalutation?: string[];

    @AutoMap()
    public readonly nameSuffix?: string[];

    @AutoMap()
    public readonly nameSortIndex?: string;

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
