import { PagedQueryParams } from '../../../shared/paging/index.js';

export class ManageableServiceProvidersForOrganisationParams extends PagedQueryParams {
    public readonly organisationId!: string;
}
