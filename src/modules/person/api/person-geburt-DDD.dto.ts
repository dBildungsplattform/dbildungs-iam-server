
export class PersonGeburtDDDDto {
    public geburtsort?: string;

    public datum?: Date;

    public constructor(geburtsort?: string, datum?: Date) {
        this.geburtsort = geburtsort;
        this.datum = datum;
    }
}
