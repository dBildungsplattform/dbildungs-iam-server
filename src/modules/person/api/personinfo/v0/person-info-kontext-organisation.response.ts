import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';

export class PersonenInfoKontextOrganisationResponse {
    @ApiProperty({ nullable: false })
    public id!: string;

    @ApiProperty({ nullable: true })
    public name?: string;

    @ApiProperty({ enum: OrganisationsTyp, nullable: true })
    public typ?: OrganisationsTyp;

    @ApiProperty({ nullable: true })
    public kennung?: string;

    public static new(
        props: Readonly<PersonenInfoKontextOrganisationResponse>,
    ): PersonenInfoKontextOrganisationResponse {
        const response: PersonenInfoKontextOrganisationResponse = new PersonenInfoKontextOrganisationResponse();

        response.id = props.id;
        response.kennung = props.kennung;
        response.name = props.name;
        response.typ = props.typ;

        return response;
    }
}
