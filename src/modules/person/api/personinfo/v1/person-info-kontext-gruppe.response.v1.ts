import { ApiProperty } from '@nestjs/swagger';
import { SchulconnexGruppeTyp } from '../schulconnex-enums.v1.js';

export class PersonenInfoKontextGruppeResponseV1 {
    @ApiProperty({ nullable: false })
    public id: string;

    @ApiProperty({ nullable: false })
    public bezeichnung: string;

    @ApiProperty({ enum: SchulconnexGruppeTyp, nullable: false })
    public typ: SchulconnexGruppeTyp;

    protected constructor(props: Readonly<PersonenInfoKontextGruppeResponseV1>) {
        this.id = props.id;
        this.bezeichnung = props.bezeichnung;
        this.typ = props.typ;
    }

    public static createNew(props: Readonly<PersonenInfoKontextGruppeResponseV1>): PersonenInfoKontextGruppeResponseV1 {
        const response: PersonenInfoKontextGruppeResponseV1 = new PersonenInfoKontextGruppeResponseV1({
            id: props.id,
            bezeichnung: props.bezeichnung,
            typ: props.typ,
        });

        return response;
    }
}
