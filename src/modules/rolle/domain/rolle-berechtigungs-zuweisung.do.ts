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

    @AutoMap(() => String)
    public id!: Persisted<string, WasPersisted>;

    @AutoMap(() => Date)
    public createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap(() => Date)
    public updatedAt!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public validForOrganisationalChildren!: boolean;

    @AutoMap()
    public validForAdministrativeParents!: boolean;

    @AutoMap(() => RolleRechtDo)
    public rolleRecht!: RolleRechtDo<boolean>;

    @AutoMap(() => RolleDo)
    public rolle!: RolleDo<boolean>;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    public schulstrukturknoten!: string;
}
