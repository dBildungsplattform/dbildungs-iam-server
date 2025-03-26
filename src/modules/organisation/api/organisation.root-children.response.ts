import { ApiProperty } from '@nestjs/swagger';
import { Organisation } from '../domain/organisation.js';
import { OrganisationResponse } from './organisation.response.js';

export class OrganisationRootChildrenResponse {
    @ApiProperty()
    public readonly oeffentlich!: OrganisationResponse;

    @ApiProperty()
    public readonly ersatz!: OrganisationResponse;

    public constructor(oeffentlich: Organisation<true>, ersatz: Organisation<true>) {
        this.oeffentlich = new OrganisationResponse(oeffentlich);
        this.ersatz = new OrganisationResponse(ersatz);
    }
}
