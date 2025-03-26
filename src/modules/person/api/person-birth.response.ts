import { ApiProperty } from '@nestjs/swagger';

export class PersonBirthResponse {
    @ApiProperty({ type: Date, nullable: true })
    public readonly datum?: Date;

    @ApiProperty({ nullable: true })
    public readonly geburtsort?: string;

    public constructor(props: Readonly<PersonBirthResponse> | undefined) {
        this.datum = props?.datum;
        this.geburtsort = props?.geburtsort;
    }
}
