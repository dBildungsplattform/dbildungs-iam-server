import { ApiProperty } from '@nestjs/swagger';

export class PersonNameResponseV1 {
    @ApiProperty()
    public readonly familiennamen: string;

    @ApiProperty()
    public readonly vorname: string;

    public constructor(props: Readonly<PersonNameResponseV1>) {
        this.familiennamen = props.familiennamen;
        this.vorname = props.vorname;
    }
}
