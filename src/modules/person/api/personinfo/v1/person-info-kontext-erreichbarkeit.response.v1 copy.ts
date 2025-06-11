import { ApiProperty } from '@nestjs/swagger';

export class PersonInfoKontextErreichbarkeitResponseV1 {
    @ApiProperty()
    public readonly typ: string;

    @ApiProperty()
    public readonly kennung: string;

    public constructor(props: Readonly<PersonInfoKontextErreichbarkeitResponseV1>) {
        this.typ = props.typ;
        this.kennung = props.kennung;
    }
}
