import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class PersonenkontextSystemrechtResponse {
    @AutoMap(() => String)
    @ApiProperty({ type: String })
    public rechtName!: string;

    @AutoMap(() => [OrganisationDo<true>])
    @ApiProperty({ type: [OrganisationDo<true>] })
    public ssks!: OrganisationDo<true>[];
}
