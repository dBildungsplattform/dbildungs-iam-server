import { AutoMap } from '@automapper/classes';
import { DoBase } from '../../../shared/types/index.js';
import { RolleEntity } from '../../../persistence/rolle.entity.js';

export class PersonRollenZuweisungDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {
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
    public person!: string;

    @AutoMap()
    public role!: RolleEntity;

    @AutoMap()
    public schoolStructureNode!: string;
}
