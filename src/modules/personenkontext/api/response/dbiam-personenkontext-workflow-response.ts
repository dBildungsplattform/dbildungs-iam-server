import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponseLegacy } from '../../../organisation/api/organisation.response.legacy.js';
import { RolleResponse } from '../../../rolle/api/rolle.response.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { TransformToArray } from '../../../../shared/util/array-transform.validator.js';
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

    @TransformToArray()
    @ApiProperty({
        description: 'Selected rollen.',
        type: [String],
        nullable: true,
    })
    public readonly selectedRollen?: string[];

    @ApiProperty({
        description: 'Indicates whether the commit action can be performed.',
        type: Boolean,
    })
    public readonly canCommit: boolean;

    public constructor(
        organisations: OrganisationResponseLegacy[],
        rollen: Rolle<true>[],
        canCommit: boolean,
        selectedOrganisation?: string,
        selectedRollen?: string[],
    ) {
        this.organisations = organisations;
        this.rollen = rollen.map((rolle: Rolle<true>) => new RolleResponse(rolle));
        this.selectedOrganisation = selectedOrganisation;
        this.selectedRollen = selectedRollen;
        this.canCommit = canCommit;
    }
}
