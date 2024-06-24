/* eslint-disable max-classes-per-file */

import { ApiProperty } from '@nestjs/swagger';
import { RollenSystemRecht } from '../../../rolle/domain/rolle.enums.js';
import { OrganisationResponseLegacy } from '../../../organisation/api/organisation.response.legacy.js';

export class SystemrechtResponse {
    @ApiProperty({ type: [OrganisationResponseLegacy] })
    public [RollenSystemRecht.ROLLEN_VERWALTEN]?: OrganisationResponseLegacy[];

    @ApiProperty({ type: [OrganisationResponseLegacy] })
    public [RollenSystemRecht.KLASSEN_VERWALTEN]?: OrganisationResponseLegacy[];

    @ApiProperty({ type: [OrganisationResponseLegacy] })
    public [RollenSystemRecht.SCHULEN_VERWALTEN]?: OrganisationResponseLegacy[];

    @ApiProperty({ type: [OrganisationResponseLegacy] })
    public [RollenSystemRecht.PERSONEN_VERWALTEN]?: OrganisationResponseLegacy[];

    @ApiProperty({ type: [OrganisationResponseLegacy] })
    public [RollenSystemRecht.SCHULTRAEGER_VERWALTEN]?: OrganisationResponseLegacy[];
}
