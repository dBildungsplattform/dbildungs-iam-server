import { ApiProperty } from '@nestjs/swagger';
import { SchulconnexOrganisationTyp } from '../schulconnex-enums.v1.js';

export class PersonenInfoKontextOrganisationResponseV1 {
    @ApiProperty()
    public id!: string;

    @ApiProperty({ nullable: true })
    public kennung?: string;

    @ApiProperty({ nullable: true })
    public name?: string;

    @ApiProperty({ enum: SchulconnexOrganisationTyp, nullable: true })
    public typ?: SchulconnexOrganisationTyp;

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
