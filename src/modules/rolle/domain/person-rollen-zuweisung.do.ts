import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { Rolle } from './rolle.js';

export class PersonRollenZuweisungDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
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
    public person!: string;

    @AutoMap()
    public rolle!: Rolle;

    @AutoMap()
    public schulstrukturknoten!: string;
}
