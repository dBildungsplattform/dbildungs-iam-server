/* eslint-disable max-classes-per-file */

import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { ApiProperty } from '@nestjs/swagger';

export class SystemrechtResponse {
    [key: string]: OrganisationDo<true>[];
}

export class PersonenkontextSystemrechtResponse {
    @ApiProperty({ type: String })
    public rechtName!: string;

    @ApiProperty({ type: [OrganisationDo<true>] })
    public ssk!: OrganisationDo<true>[];

    @ApiProperty({ description: 'Returns SystemrechtResponse', type: [SystemrechtResponse] })
    public get response(): SystemrechtResponse {
        const systemrechtResponse: SystemrechtResponse = {};
        systemrechtResponse[this.rechtName] = this.ssk;
        return systemrechtResponse;
    }
}
