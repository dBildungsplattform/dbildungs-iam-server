import { AutoMap } from '@automapper/classes';

export class DoBase<WasPersisted extends boolean = false> {
    @AutoMap()
    public id!: WasPersisted extends true ? string : Option<string>;

    @AutoMap()
    public createdAt!: WasPersisted extends true ? Date : Option<Date>;

    @AutoMap()
    public updatedAt!: WasPersisted extends true ? Date : Option<Date>;
}
