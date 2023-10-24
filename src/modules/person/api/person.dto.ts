import { AutoMap } from '@automapper/classes';
import { Gender, TrustLevel } from '../domain/person.enums.js';

export class PersonDto {
    @AutoMap()
    public id?: string;

    @AutoMap(() => Date)
    public createdAt?: Date;

    @AutoMap(() => Date)
    public updatedAt!: Date;

    @AutoMap()
    public keycloakUserId!: string;

    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public client: string = '';

    @AutoMap()
    public readonly mainOrganization?: string;

    @AutoMap()
    public lastName: string = '';

    @AutoMap()
    public firstName: string = '';

    @AutoMap()
    public initialsLastName?: string;

    @AutoMap()
    public initialsFirstName?: string;

    @AutoMap()
    public nickName?: string;

    @AutoMap()
    public nameTitle?: string;

    @AutoMap(() => [String])
    public nameSalutation?: string[];

    @AutoMap(() => [String])
    public namePrefix?: string[];

    @AutoMap(() => [String])
    public nameSuffix?: string[];

    @AutoMap()
    public nameSortIndex?: string;

    @AutoMap(() => Date)
    public birthDate?: Date;

    @AutoMap()
    public birthPlace?: string;

    @AutoMap(() => String)
    public gender?: Gender;

    @AutoMap()
    public localization?: string = 'de-DE';

    @AutoMap(() => String)
    public trustLevel?: TrustLevel;

    @AutoMap()
    public isInformationBlocked?: boolean;
}
