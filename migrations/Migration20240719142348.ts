import { Migration } from '@mikro-orm/migrations';

export class Migration20240719142348 extends Migration {
    public up(): void {
        this.addSql('create index "organisation_administriert_von_index" on "organisation" ("administriert_von");');
        this.addSql('create index "organisation_typ_index" on "organisation" ("typ");');

        this.addSql(
            'alter table "person" add constraint "person_keycloak_user_id_unique" unique ("keycloak_user_id");',
        );
        this.addSql('alter table "person" add constraint "person_personalnummer_unique" unique ("personalnummer");');

        this.addSql('create index "personenkontext_person_id_index" on "personenkontext" ("person_id");');
    }

    public override down(): void {
        this.addSql('drop index "organisation_administriert_von_index";');
        this.addSql('drop index "organisation_typ_index";');

        this.addSql('alter table "person" drop constraint "person_keycloak_user_id_unique";');
        this.addSql('alter table "person" drop constraint "person_personalnummer_unique";');

        this.addSql('drop index "personenkontext_person_id_index";');
    }
}
