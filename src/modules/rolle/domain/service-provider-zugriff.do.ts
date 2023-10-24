import { AutoMap } from '@automapper/classes';
import { RolleRechtDo } from './rolle-recht.do.js';

export class ServiceProviderZugriffDo<WasPersisted extends boolean> extends RolleRechtDo<WasPersisted> {
    /**
     * @deprecated This constructor is for automapper only.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    public constructor() {
        super();
    }

    @AutoMap()
    public serviceProvider!: string;
}
