export class CreatedPersonenkontextOrganisationDto {
    public id!: string;

    public static new(props: Readonly<CreatedPersonenkontextOrganisationDto>): CreatedPersonenkontextOrganisationDto {
        const response: CreatedPersonenkontextOrganisationDto = new CreatedPersonenkontextOrganisationDto();

        response.id = props.id;

        return response;
    }
}
