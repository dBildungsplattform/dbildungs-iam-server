import { Migration } from '@mikro-orm/migrations';

// eslint-disable-next-line @typescript-eslint/naming-convention
export class Migration20240719_Indices extends Migration {
    public up(): void {
        // Index on Personenkontext.PersonID
        this.addSql('create index "personenkontext_person_id_index" on "personenkontext" ("person_id");');
        // Index on Organisation.AdministriertVon
        this.addSql('create index "organisation_administriert_von_index" on "organisation" ("administriert_von");');
        // Index on Organisation.typ
        this.addSql('create index "organisation_typ_index" on "organisation" ("typ");');
        // Unique constraint on Person.keycloak_user_id
        this.addSql(
            'alter table "person" add constraint "person_keycloak_user_id_unique" unique ("keycloak_user_id");',
        );
        // Unique constraint on Person.personalnummer
        this.addSql('alter table "person" add constraint "person_personalnummer_unique" unique ("personalnummer");');
    }
}
