import { Injectable } from '@nestjs/common';
import { UsernameGeneratorService } from './username-generator.service.js';
import { Person } from './person.js';
import { Geschlecht, Vertrauensstufe } from './person.enums.js';

@Injectable()
export class PersonFactory {
    public constructor(private usernameGenerator: UsernameGeneratorService) {}

    public async createNew(
        familienname: string,
        vorname: string,
        referrer?: string,
        stammorganisation?: string,
        initialenFamilienname?: string,
        initialenVorname?: string,
        rufname?: string,
        nameTitel?: string,
        nameAnrede?: string[],
        namePraefix?: string[],
        nameSuffix?: string[],
        nameSortierindex?: string,
        geburtsdatum?: Date,
        geburtsort?: string,
        geschlecht?: Geschlecht,
        lokalisierung?: string,
        vertrauensstufe?: Vertrauensstufe,
        auskunftssperre?: boolean,
        username?: string,
        password?: string,
    ): Promise<Person<false>> {
        const person: Person<false> = await Person.createNew(
            this.usernameGenerator,
            familienname,
            vorname,
            referrer,
            stammorganisation,
            initialenFamilienname,
            initialenVorname,
            rufname,
            nameTitel,
            nameAnrede,
            namePraefix,
            nameSuffix,
            nameSortierindex,
            geburtsdatum,
            geburtsort,
            geschlecht,
            lokalisierung,
            vertrauensstufe,
            auskunftssperre,
            username,
            password,
        );

        return person;
    }
}
