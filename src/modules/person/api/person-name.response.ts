import { ApiProperty } from '@nestjs/swagger';

export class PersonNameResponse {
    @ApiProperty()
    public readonly familiennamen: string;

    @ApiProperty()
    public readonly vorname: string;

    @ApiProperty({ nullable: true })
    public readonly initialenfamilienname?: string;

    @ApiProperty({ nullable: true })
    public readonly initialenvorname?: string;

    @ApiProperty({ nullable: true })
    public readonly rufname?: string;

    @ApiProperty({ nullable: true })
    public readonly titel?: string;

    @ApiProperty({ type: [String], nullable: true })
    public readonly anrede?: string[];

    @ApiProperty({ type: [String], nullable: true })
    public readonly namenspraefix?: string[];

    @ApiProperty({ type: [String], nullable: true })
    public readonly namenssuffix?: string[];

    @ApiProperty({ nullable: true })
    public readonly sortierindex?: string;

    public constructor(props: Readonly<PersonNameResponse>) {
        this.familiennamen = props.familiennamen;
        this.vorname = props.vorname;
        this.initialenfamilienname = props.initialenfamilienname;
        this.initialenvorname = props.initialenvorname;
        this.rufname = props.rufname;
        this.titel = props.titel;
        this.anrede = props.anrede;
        this.namenspraefix = props.namenspraefix;
        this.namenssuffix = props.namenssuffix;
        this.sortierindex = props.sortierindex;
    }
}
