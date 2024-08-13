export class CreatedPersonenkontextOrganisation {
    public id!: string;

    public static new(props: Readonly<CreatedPersonenkontextOrganisation>): CreatedPersonenkontextOrganisation {
        const response: CreatedPersonenkontextOrganisation = new CreatedPersonenkontextOrganisation();

        response.id = props.id;

        return response;
    }
}
