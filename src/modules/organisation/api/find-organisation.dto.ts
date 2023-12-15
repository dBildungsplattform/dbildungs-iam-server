import { AutoMap } from '@automapper/classes';
import { PagedDto } from '../../../shared/paging/index.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class FindOrganisationDto extends PagedDto {
    @AutoMap()
    public kennung?: string;

    @AutoMap()
    public name?: string;

    @AutoMap(() => String)
    public typ?: OrganisationsTyp;
}
