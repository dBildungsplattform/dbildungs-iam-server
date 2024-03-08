/* eslint-disable max-classes-per-file */

import { ApiProperty } from '@nestjs/swagger';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';

export class SystemrechtResponse {
    @ApiProperty({ type: [OrganisationResponse] })
    public [RollenSystemRecht.ROLLEN_VERWALTEN]?: OrganisationResponse[];
}
