import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { RollenSystemRechtServiceProviderIDResponse } from './rolle-systemrechte-serviceproviderid.response.js';

export class PersonenkontextRolleFieldsResponse {
    @ApiProperty({ type: OrganisationResponse })
    public organisation: OrganisationResponse;

    @ApiProperty({ type: RollenSystemRechtServiceProviderIDResponse })
    public rolle: RollenSystemRechtServiceProviderIDResponse;

    public constructor(organisation: OrganisationResponse, rolle: RollenSystemRechtServiceProviderIDResponse) {
        this.organisation = organisation;
        this.rolle = rolle;
    }
}
