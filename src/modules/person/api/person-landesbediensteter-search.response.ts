import { ApiProperty } from '@nestjs/swagger';
import { PersonLandesbediensteterSearchPersonenkontextResponse } from './person-landesbediensteter-search-personenkontext.response.js';

export class PersonLandesbediensteterSearchResponse {
    @ApiProperty({ type: String, required: true })
    public readonly vorname: string;

    @ApiProperty({ type: String, required: true })
    public readonly nachname: string;

    @ApiProperty({ type: String, required: true })
    public readonly username: string;

    @ApiProperty({ type: String, required: true })
    public readonly personalnummer: string;

    @ApiProperty({ type: String, required: true })
    public readonly primaryEmailAddress: string;

    @ApiProperty({ type: Array<PersonLandesbediensteterSearchPersonenkontextResponse> })
    public personenkontexte: PersonLandesbediensteterSearchPersonenkontextResponse[];

    public constructor(
        vorname: string,
        nachname: string,
        username: string,
        personalnummer: string,
        primaryEmailAddress: string,
        personenkontexte: PersonLandesbediensteterSearchPersonenkontextResponse[],
    ) {
        this.vorname = vorname;
        this.nachname = nachname;
        this.username = username;
        this.personalnummer = personalnummer;
        this.primaryEmailAddress = primaryEmailAddress;
        this.personenkontexte = personenkontexte;
    }
}
