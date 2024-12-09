import { Migration } from '@mikro-orm/migrations';

export class Migration20241127092339 extends Migration {
    public async up(): Promise<void> {
        this.addSql('create extension if not exists pg_trgm;'); // manually added

        this.addSql('create index "person_referrer_trgm_index" on "person" using gin ("referrer" gin_trgm_ops);;');
        this.addSql(
            'create index "person_familienname_trgm_index" on "person" using gin ("familienname" gin_trgm_ops);;',
        );
        this.addSql('create index "person_vorname_trgm_index" on "person" using gin ("vorname" gin_trgm_ops);;');
        this.addSql(
            'create index "person_personalnummer_trgm_index" on "person" using gin ("personalnummer" gin_trgm_ops);;',
        );

        this.addSql('create index "email_address_person_id_index" on "email_address" ("person_id");');

        this.addSql('create index "personenkontext_organisation_id_index" on "personenkontext" ("organisation_id");');

        this.addSql('create index "rolle_merkmal_rolle_id_index" on "rolle_merkmal" ("rolle_id");');

        this.addSql('create index "rolle_systemrecht_rolle_id_index" on "rolle_systemrecht" ("rolle_id");');
    }

    public override async down(): Promise<void> {
        this.addSql('drop extension if exists pg_trgm;'); // manually added

        this.addSql('drop index "person_referrer_trgm_index";');
        this.addSql('drop index "person_familienname_trgm_index";');
        this.addSql('drop index "person_vorname_trgm_index";');
        this.addSql('drop index "person_personalnummer_trgm_index";');

        this.addSql('drop index "email_address_person_id_index";');

        this.addSql('drop index "personenkontext_organisation_id_index";');

        this.addSql('drop index "rolle_merkmal_rolle_id_index";');

        this.addSql('drop index "rolle_systemrecht_rolle_id_index";');
    }
}
