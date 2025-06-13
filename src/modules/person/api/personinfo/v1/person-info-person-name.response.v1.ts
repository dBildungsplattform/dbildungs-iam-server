import { ApiProperty } from '@nestjs/swagger';

export class PersonInfoPersonNameResponseV1 {
    @ApiProperty()
    public readonly familiennamen: string;

    @ApiProperty()
    public readonly vorname: string;

    public constructor(props: Readonly<PersonInfoPersonNameResponseV1>) {
        this.familiennamen = props.familiennamen;
        this.vorname = props.vorname;
    }
}
