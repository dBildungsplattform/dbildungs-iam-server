import { AutoMap } from '@automapper/classes';

export class FindePersonDatensatzDTO {
    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public familienname?: string;

    @AutoMap()
    public vorname?: string;
}
