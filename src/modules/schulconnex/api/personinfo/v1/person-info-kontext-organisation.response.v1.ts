import { ApiProperty } from '@nestjs/swagger';
import { SchulconnexOrganisationTyp } from '../../schulconnex-enums.v1.js';

export class PersonenInfoKontextOrganisationResponseV1 {
    @ApiProperty()
    public id: string;

    @ApiProperty({ nullable: true })
    public kennung?: string;

    @ApiProperty({ nullable: true })
    public name?: string;

    @ApiProperty({ enum: SchulconnexOrganisationTyp, nullable: true })
    public typ?: SchulconnexOrganisationTyp;

    protected constructor(props: Readonly<PersonenInfoKontextOrganisationResponseV1>) {
        this.id = props.id;
        this.kennung = props.kennung;
        this.name = props.name;
        this.typ = props.typ;
    }

    public static createNew(
        props: Readonly<PersonenInfoKontextOrganisationResponseV1>,
    ): PersonenInfoKontextOrganisationResponseV1 {
        const response: PersonenInfoKontextOrganisationResponseV1 = new PersonenInfoKontextOrganisationResponseV1({
            id: props.id,
            kennung: props.kennung,
            name: props.name,
            typ: props.typ,
        });

        return response;
    }
}
