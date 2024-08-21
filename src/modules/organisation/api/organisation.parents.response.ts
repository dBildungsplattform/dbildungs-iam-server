import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponse } from './organisation.response.js';
import { Organisation } from '../domain/organisation.js';

export class OrganisationParentsResponse {
    @ApiProperty({ type: [OrganisationResponse] })
    public readonly parents!: Array<OrganisationResponse>;

    public constructor(parents: Array<Organisation<true>>) {
        this.parents = parents.map((organisation: Organisation<true>) => new OrganisationResponse(organisation));
    }
}
