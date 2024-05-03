import { ApiProperty } from '@nestjs/swagger';
import { OrganisationID } from '../../../shared/types/index.js';
import { RollenSystemRechtServiceProviderIDResponse } from './rolle-systemrechte-serviceproviderid.response.js';

export class PersonenkontextRolleFieldsResponse {
    @ApiProperty({ type: String })
    public organisationsId: OrganisationID;

    @ApiProperty({ type: RollenSystemRechtServiceProviderIDResponse })
    public rolle: RollenSystemRechtServiceProviderIDResponse;

    public constructor(organisationsId: OrganisationID, rolle: RollenSystemRechtServiceProviderIDResponse) {
        this.organisationsId = organisationsId;
        this.rolle = rolle;
    }
}
