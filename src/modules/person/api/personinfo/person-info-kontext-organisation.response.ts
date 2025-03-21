import { OrganisationsTyp } from '../../../organisation/domain/organisation.enums.js';

export class PersonenInfoKontextOrganisationResponse {
    public id!: string;

    public name?: string;

    public typ?: OrganisationsTyp;

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
