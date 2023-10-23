import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { Gender, TrustLevel } from './person.enums.js';

export class PersonDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    @AutoMap(() => String)
    public id!: Persisted<string, WasPersisted>;

    @AutoMap(() => Date)
    public createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap(() => Date)
    public updatedAt!: Persisted<Date, WasPersisted>;

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

    @AutoMap()
    public nameSalutation?: string[];

    @AutoMap()
    public namePrefix?: string[];

    @AutoMap()
    public nameSuffix?: string[];

    @AutoMap()
    public nameSortIndex?: string;

    @AutoMap()
    public birthDate?: Date;

    @AutoMap()
    public birthPlace?: string;

    @AutoMap()
    public gender?: Gender;

    @AutoMap()
    public localization?: string = 'de-DE';

    @AutoMap()
    public trustLevel?: TrustLevel;

    @AutoMap()
    public isInformationBlocked?: boolean;
}
