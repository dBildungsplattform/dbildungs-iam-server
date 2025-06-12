import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoKontextV1ErreichbarkeitTyp } from './person-info-enums.v1.js';


export class PersonInfoKontextErreichbarkeitResponseV1 {
    @ApiProperty({enum: PersonInfoKontextV1ErreichbarkeitTyp})
    public readonly typ: PersonInfoKontextV1ErreichbarkeitTyp;

    @ApiProperty()
    public readonly kennung: string;

    public constructor(props: Readonly<PersonInfoKontextErreichbarkeitResponseV1>) {
        this.typ = props.typ;
        this.kennung = props.kennung;
    }
}
