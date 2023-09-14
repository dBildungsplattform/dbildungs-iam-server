import { AutoMap } from '@automapper/classes';

export class UserDo<WasPersisted extends boolean> {
    @AutoMap()
    public id!: Persisted<string, WasPersisted>;

    @AutoMap()
    public email!: string;

    @AutoMap()
    public createdDate!: Persisted<Date, WasPersisted>;
}
