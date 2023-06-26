import { AutoMap } from '@automapper/classes';

export abstract class DoBase<WasPersisted extends true | false = false> {
    @AutoMap()
    public id!: WasPersisted extends true ? string : Option<string>;

    @AutoMap()
    public createdAt!: WasPersisted extends true ? Date : Option<Date>;

    @AutoMap()
    public updatedAt!: WasPersisted extends true ? Date : Option<Date>;
}
