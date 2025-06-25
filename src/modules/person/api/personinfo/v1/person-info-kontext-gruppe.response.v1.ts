import { ApiProperty } from '@nestjs/swagger';
import { SchulconnexGruppeTyp } from '../schulconnex-enums.v1.js';

export class PersonenInfoKontextGruppeResponseV1 {
    @ApiProperty({ nullable: false })
    public id!: string;

    @ApiProperty({ nullable: false })
    public bezeichnung!: string;

    @ApiProperty({ enum: SchulconnexGruppeTyp, nullable: false })
    public typ!: SchulconnexGruppeTyp;

    public static createNew(props: Readonly<PersonenInfoKontextGruppeResponseV1>): PersonenInfoKontextGruppeResponseV1 {
        const response: PersonenInfoKontextGruppeResponseV1 = new PersonenInfoKontextGruppeResponseV1();

        response.id = props.id;
        response.bezeichnung = props.bezeichnung;
        response.typ = props.typ;

        return response;
    }
}
