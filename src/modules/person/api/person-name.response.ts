import { ApiProperty } from '@nestjs/swagger';

export class PersonNameResponse {
    @ApiProperty()
    public readonly familiennamen: string;

    @ApiProperty()
    public readonly vorname: string;

    public constructor(props: Readonly<PersonNameResponse>) {
        this.familiennamen = props.familiennamen;
        this.vorname = props.vorname;
    }
}
