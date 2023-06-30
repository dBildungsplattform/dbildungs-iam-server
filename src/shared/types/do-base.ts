export abstract class DoBase<WasPersisted extends boolean> {
    public id!: WasPersisted extends true ? string : Option<string>;

    public createdAt!: WasPersisted extends true ? Date : Option<Date>;

    public updatedAt!: WasPersisted extends true ? Date : Option<Date>;
}
