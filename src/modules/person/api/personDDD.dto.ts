import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { PersonNameDto } from './person-name.dto.js';
import { PersonGeburtDto } from './person-geburt.dto.js';

export class PersonDDDDto {
    public id!: string;

    public createdAt!: Date;

    public updatedAt!: Date;

    public keycloakUserId!: string;

    public referrer?: string;

    public mandant: string = '';

    public stammorganisation?: string;

    public name!: PersonNameDto;

    public geburt!: PersonGeburtDto;

    public geschlecht?: Geschlecht;

    public lokalisierung?: string;

    public vertrauensstufe?: Vertrauensstufe;

    public auskunftssperre?: boolean;

    public revision!: string;

    public startpasswort?: string;

}
