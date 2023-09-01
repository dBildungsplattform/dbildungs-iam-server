import { AutoMap } from '@automapper/classes';

export class FindPersonDTO {
    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public familyName?: string;

    @AutoMap()
    public firstName?: string;
}
