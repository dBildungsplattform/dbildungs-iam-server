import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoKontextV1GruppeTyp } from './person-info-enums.v1.js';

export class PersonenInfoKontextGruppeResponseV1 {
    @ApiProperty({ nullable: false })
    public id!: string;

    @ApiProperty({ nullable: false })
    public bezeichnung!: string;

    @ApiProperty({ enum: PersonInfoKontextV1GruppeTyp, nullable: false })
    public typ!: PersonInfoKontextV1GruppeTyp;

    public static createNew(props: Readonly<PersonenInfoKontextGruppeResponseV1>): PersonenInfoKontextGruppeResponseV1 {
        const response: PersonenInfoKontextGruppeResponseV1 = new PersonenInfoKontextGruppeResponseV1();

        response.id = props.id;
        response.bezeichnung = props.bezeichnung;
        response.typ = props.typ;

        return response;
    }
}
