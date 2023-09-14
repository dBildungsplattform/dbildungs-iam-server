import { AutoMap } from '@automapper/classes';

export class UserDo<WasPersisted extends boolean> {
    @AutoMap()
    public id!: Persisted<string, WasPersisted>;

    @AutoMap()
    public username!: string;

    @AutoMap()
    public email!: string;

    @AutoMap()
    public firstName!: string;

    @AutoMap()
    public lastName!: string;

    @AutoMap()
    public createdDate!: Persisted<Date, WasPersisted>;
}
