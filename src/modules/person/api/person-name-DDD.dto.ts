export class PersonNameDDDDto {
    public vorname: string;

    public familienname: string;

    public initialenfamilienname?: string;

    public initialenvorname?: string;

    public rufname?: string;

    public titel?: string;

    public anrede?: string[];

    public namenssuffix?: string[];

    public namenspraefix?: string[];

    public sortierindex?: string;

    public constructor(
        vorname: string = '',
        familienname: string = '',
        initialenfamilienname?: string,
        initialenvorname?: string,
        rufname?: string,
        titel?: string,
        anrede?: string[],
        namenssuffix?: string[],
        namenspraefix?: string[],
        sortierindex?: string,
    ) {
        this.vorname = vorname;
        this.familienname = familienname;
        this.initialenfamilienname = initialenfamilienname;
        this.initialenvorname = initialenvorname;
        this.rufname = rufname;
        this.titel = titel;
        this.anrede = anrede;
        this.namenssuffix = namenssuffix;
        this.namenspraefix = namenspraefix;
        this.sortierindex = sortierindex;
    }
}
