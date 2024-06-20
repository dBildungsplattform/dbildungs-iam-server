import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponseLegacy } from '../../../organisation/api/organisation.response.legacy.js';
import { RolleResponse } from '../../../rolle/api/rolle.response.js';


export class PersonenkontextWorkflowResponse {
    @ApiProperty({
        description: 'List of available organisations.',
        type: [OrganisationResponseLegacy],
    })
    public readonly organisations: OrganisationResponseLegacy[];

    @ApiProperty({
        description: 'List of available roles.',
        type: [RolleResponse],
    })
    public readonly rollen: RolleResponse[];

    @ApiProperty({
        description: 'Selected organisation.',
        type: String,
        nullable: true,
    })
    public readonly selectedOrganisation?: string;

    @ApiProperty({
        description: 'Selected role.',
        type: String,
        nullable: true,
    })
    public readonly selectedRole?: string;

    @ApiProperty({
        description: 'Indicates whether the commit action can be performed.',
        type: Boolean,
    })
    public readonly canCommit: boolean;

    public constructor(
        organisations: OrganisationResponseLegacy[],
        rollen: RolleResponse[],
        canCommit: boolean,
        selectedOrganisation?: string,
        selectedRole?: string,
    ) {
        this.organisations = organisations;
        this.rollen = rollen;
        this.selectedOrganisation = selectedOrganisation;
        this.selectedRole = selectedRole;
        this.canCommit = canCommit;
    }
}
