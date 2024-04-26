import { ApiProperty } from '@nestjs/swagger';
import { OrganisationID } from '../../../shared/types/index.js';
import { RollenSystemRechtServiceProviderID } from './rolle-systemrechte-serviceproviderid.response.js';

export class PersonenkontextRolleFieldsResponse {
    @ApiProperty({ type: String })
    public organisationsId: OrganisationID;

    @ApiProperty({ type: RollenSystemRechtServiceProviderID })
    public rolle: RollenSystemRechtServiceProviderID;

    public constructor(organisationsId: OrganisationID, rolle: RollenSystemRechtServiceProviderID) {
        this.organisationsId = organisationsId;
        this.rolle = rolle;
    }
}
