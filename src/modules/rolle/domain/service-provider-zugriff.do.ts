import { AutoMap } from '@automapper/classes';
import { RolleRechtDo } from './rolle-recht.do.js';

//export class ServiceProviderZugriffDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
export class ServiceProviderZugriffDo<WasPersisted extends boolean> extends RolleRechtDo<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {
        super();
    }

    /*@AutoMap()
    public override id!: Persisted<string, WasPersisted>;

    @AutoMap()
    public override createdAt!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public override updatedAt!: Persisted<Date, WasPersisted>;*/

    @AutoMap()
    public serviceProvider!: string;
}
