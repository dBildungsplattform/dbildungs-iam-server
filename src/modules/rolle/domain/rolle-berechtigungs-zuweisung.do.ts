import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { RolleRechtDo } from './rolle-recht.do.js';
import { RolleDo } from './rolle.do.js';

export class RolleBerechtigungsZuweisungDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {}

    @AutoMap()
    public id!: Persisted<string, WasPersisted>;

    @AutoMap()
    public createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public updatedAt!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public validForOrganisationalChildren!: boolean;

    @AutoMap()
    public validForAdministrativeParents!: boolean;

    @AutoMap()
    public rolePermission!: RolleRechtDo<true>;

    @AutoMap()
    public role!: RolleDo<true>;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    public schulstrukturknoten!: string;
}
