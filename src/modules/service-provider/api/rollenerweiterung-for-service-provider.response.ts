import { ApiProperty } from '@nestjs/swagger';

import { RollenerweiterungForManageableServiceProvider } from '../domain/types.js';
import { OrganisationRefResponse } from './organisation-ref.response.js';
import { RolleRefResponse } from './rolle-ref.response.js';

export class RollenerweiterungForServiceProviderResponse {
    @ApiProperty({ type: OrganisationRefResponse })
    public organisation: OrganisationRefResponse;

    @ApiProperty({ type: RolleRefResponse })
    public rolle: RolleRefResponse;

    public constructor(rollenerweiterungForSp: RollenerweiterungForManageableServiceProvider) {
        this.organisation = OrganisationRefResponse.fromOrganisation(rollenerweiterungForSp.organisation);
        this.rolle = RolleRefResponse.fromRolle(rollenerweiterungForSp.rolle);
    }
}
