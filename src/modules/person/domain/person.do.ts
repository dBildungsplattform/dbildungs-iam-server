import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { Gender, TrustLevel } from './person.enums.js';

export class PersonDo<WasPersisted extends boolean> extends DoBase<WasPersisted> {
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
