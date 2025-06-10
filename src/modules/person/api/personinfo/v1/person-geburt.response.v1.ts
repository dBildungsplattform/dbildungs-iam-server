import { ApiProperty } from '@nestjs/swagger';

export class PersonGeburtResponseV1 {
    @ApiProperty()
    public readonly datum: string;

    @ApiProperty()
    public readonly volljaehrig: string;

    public constructor(props: Readonly<PersonGeburtResponseV1>) {
        this.datum = props.datum;
        this.volljaehrig = props.volljaehrig;
    }
}
