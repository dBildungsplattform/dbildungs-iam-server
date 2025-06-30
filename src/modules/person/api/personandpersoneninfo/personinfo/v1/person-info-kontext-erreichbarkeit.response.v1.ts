import { ApiProperty } from '@nestjs/swagger';
import { SchulconnexErreichbarkeitTyp } from '../../schulconnex-enums.v1.js';

export class PersonInfoKontextErreichbarkeitResponseV1 {
    @ApiProperty({ enum: SchulconnexErreichbarkeitTyp })
    public readonly typ: SchulconnexErreichbarkeitTyp;

    @ApiProperty()
    public readonly kennung: string;

    public constructor(props: Readonly<PersonInfoKontextErreichbarkeitResponseV1>) {
        this.typ = props.typ;
        this.kennung = props.kennung;
    }
}
