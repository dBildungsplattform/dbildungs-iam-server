import { ApiProperty } from '@nestjs/swagger';
import { RollenerweiterungForManageableServiceProvider } from '../domain/types';
import { OrganisationRefResponse } from './organisation-ref.response.js';
import { RolleRefResponse } from './rolle-ref.response.js';

export class RollenerweiterungForManageableServiceProviderResponse {
    @ApiProperty({ type: OrganisationRefResponse })
    public organisation: OrganisationRefResponse;

    @ApiProperty({ type: RolleRefResponse })
    public rolle: RolleRefResponse;

    public constructor(organisation: OrganisationRefResponse, rolle: RolleRefResponse) {
        this.organisation = organisation;
        this.rolle = rolle;
    }

    public static fromRollenerweiterungForManageableServiceProvider(
        data: RollenerweiterungForManageableServiceProvider,
    ): RollenerweiterungForManageableServiceProviderResponse {
        return new RollenerweiterungForManageableServiceProviderResponse(
            OrganisationRefResponse.fromOrganisation(data.organisation),
            RolleRefResponse.fromRolle(data.rolle),
        );
    }
}
