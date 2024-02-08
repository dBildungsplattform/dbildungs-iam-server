import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { PersonGeburtDto } from './person-geburt.dto.js';
import { PersonNameDto } from './person-name.dto.js';

export class PersonDDDDto {
    public id: string;

    public createdAt: Date;

    public updatedAt: Date;

    public keycloakUserId: string;

    public referrer?: string;

    public mandant: string;

    public stammorganisation?: string;

    public name: PersonNameDto;

    public geburt: PersonGeburtDto;

    public geschlecht?: Geschlecht;

    public lokalisierung?: string;

    public vertrauensstufe?: Vertrauensstufe;

    public auskunftssperre?: boolean;

    public revision: string;

    public startpasswort?: string;

    public constructor(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        keycloakUserId: string,
        referrer: string | undefined,
        mandant: string,
        stammorganisation: string | undefined,
        name: PersonNameDto,
        geburt: PersonGeburtDto,
        geschlecht: Geschlecht | undefined,
        lokalisierung: string | undefined,
        vertrauensstufe: Vertrauensstufe | undefined,
        auskunftssperre: boolean | undefined,
        revision: string,
        startpasswort?: string | undefined,
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.keycloakUserId = keycloakUserId;
        this.referrer = referrer;
        this.mandant = mandant;
        this.stammorganisation = stammorganisation;
        this.name = name;
        this.geburt = geburt;
        this.geschlecht = geschlecht;
        this.lokalisierung = lokalisierung;
        this.vertrauensstufe = vertrauensstufe;
        this.auskunftssperre = auskunftssperre;
        this.revision = revision;
        this.startpasswort = startpasswort;
    }
}
