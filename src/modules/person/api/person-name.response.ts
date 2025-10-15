import { ApiProperty } from '@nestjs/swagger';

export class PersonNameResponse {
    @ApiProperty()
    public readonly familiennamen: string;

    @ApiProperty()
    public readonly familienname: string;

    @ApiProperty()
    public readonly vorname: string;

    public constructor(props: Readonly<PersonNameResponse>) {
        this.familiennamen = props.familiennamen;
        this.familienname = props.familienname;
        this.vorname = props.vorname;
    }
}
