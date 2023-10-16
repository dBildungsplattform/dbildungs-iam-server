import { AutoMap } from '@automapper/classes';
import { PagedDto } from '../../../shared/paging/index.js';

export class FindPersonDatensatzDTO extends PagedDto {
    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public familienname?: string;

    @AutoMap()
    public vorname?: string;
}
