import { ApiProperty } from '@nestjs/swagger';
import { OrganisationID } from '../../../shared/types';
import { Organisation } from '../../organisation/domain/organisation';

export class OrganisationRefResponse {
    @ApiProperty()
    public id: OrganisationID;

    @ApiProperty()
    public name: string;

    @ApiProperty({ required: false })
    public kennung?: string;

    public constructor(id: OrganisationID, name: string, kennung?: string) {
        this.id = id;
        this.name = name;
        this.kennung = kennung;
    }

    public static fromOrganisation(organisation: Organisation<true>): OrganisationRefResponse {
        return new OrganisationRefResponse(organisation.id, organisation.name ?? '', organisation.kennung);
    }
}
