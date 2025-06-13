import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoKontextV1OrganisationTyp } from './person-info-enums.v1.js';

export class PersonenInfoKontextOrganisationResponseV1 {
    @ApiProperty({ nullable: false })
    public id!: string;

    @ApiProperty({ nullable: true })
    public kennung?: string;

    @ApiProperty({ nullable: true })
    public name?: string;

    @ApiProperty({ enum: PersonInfoKontextV1OrganisationTyp, nullable: true })
    public typ?: PersonInfoKontextV1OrganisationTyp;

    public static createNew(
        props: Readonly<PersonenInfoKontextOrganisationResponseV1>,
    ): PersonenInfoKontextOrganisationResponseV1 {
        const response: PersonenInfoKontextOrganisationResponseV1 = new PersonenInfoKontextOrganisationResponseV1();

        response.id = props.id;
        response.kennung = props.kennung;
        response.name = props.name;
        response.typ = props.typ;

        return response;
    }
}
