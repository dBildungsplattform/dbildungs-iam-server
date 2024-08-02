import { AutoMap } from '@automapper/classes';

export class UserDo<WasPersisted extends boolean> {
    @AutoMap()
    public id!: Persisted<string, WasPersisted>;

    @AutoMap()
    public username!: string;

    @AutoMap()
    public email?: string | undefined;

    @AutoMap()
    public createdDate!: Persisted<Date, WasPersisted>;

    @AutoMap()
    public enabled!: boolean;

    @AutoMap()
    public attributes!: Record<string, string>;
}
