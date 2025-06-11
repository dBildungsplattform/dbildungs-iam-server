import { ApiProperty } from '@nestjs/swagger';

export class PersonInfoGeburtResponseV1 {
    @ApiProperty()
    public readonly datum: string;

    @ApiProperty()
    public readonly volljaehrig: string;

    public constructor(props: Readonly<PersonInfoGeburtResponseV1>) {
        this.datum = props.datum;
        this.volljaehrig = props.volljaehrig;
    }
}
