import { PagedDto } from '../../../shared/paging/index.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';

export class FindOrganisationDto extends PagedDto {
    public kennung?: string;

    public name?: string;

    public typ?: OrganisationsTyp;
}
