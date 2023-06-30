import { AutoMap } from '@automapper/classes';
import { Gender, TrustLevel } from './person.enums.js';

export class CreatePersonDto {
    @AutoMap()
    public readonly referrer?: string;

    @AutoMap()
    public readonly client!: string;

    @AutoMap()
    public readonly mainOrganization?: string;

    @AutoMap()
    public readonly lastName!: string;

    @AutoMap()
    public readonly firstName!: string;

    @AutoMap()
    public readonly initialsLastName?: string;

    @AutoMap()
    public readonly initialsFirstName?: string;

    @AutoMap()
    public readonly nickName?: string;

    @AutoMap()
    public readonly nameTitle?: string;

    @AutoMap()
    public readonly nameSalutation?: string[];

    @AutoMap()
    public readonly namePrefix?: string[];

    @AutoMap()
    public readonly nameSuffix?: string[];

    @AutoMap()
    public readonly nameSortIndex?: string;

    @AutoMap()
    public readonly birthDate?: Date;

    @AutoMap()
    public readonly birthPlace?: string;

    @AutoMap()
    public readonly gender?: Gender;

    @AutoMap()
    public readonly localization?: string;

    @AutoMap()
    public readonly trustLevel?: TrustLevel;

    @AutoMap()
    public readonly isInformationBlocked?: boolean;
}
