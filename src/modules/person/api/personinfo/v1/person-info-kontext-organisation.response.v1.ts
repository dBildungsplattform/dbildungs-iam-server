import { ApiProperty } from '@nestjs/swagger';

type TPersonenInfoKontextOrganisationTyp = 'Schule' | 'Anbieter' | 'Sonstige'

export class PersonenInfoKontextOrganisationResponseV1 {
    @ApiProperty({ nullable: false })
    public id!: string;

    @ApiProperty({ nullable: true })
    public kennung?: string;

    @ApiProperty({ nullable: true })
    public name?: string;

    @ApiProperty({ nullable: true })
    public typ?: TPersonenInfoKontextOrganisationTyp;

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
