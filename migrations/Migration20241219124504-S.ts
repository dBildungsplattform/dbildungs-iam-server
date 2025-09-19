import { Migration } from '@mikro-orm/migrations';

export class Migration20241219124504 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter table "importvorgang" rename column "import_by_person_id" to "person_id";');

        this.addSql(
            'alter table "importvorgang" add constraint "importvorgang_person_id_foreign" foreign key ("person_id") references "person" ("id") on update cascade on delete set null;',
        );
        this.addSql(
            'alter table "importvorgang" add constraint "importvorgang_rolle_id_foreign" foreign key ("rolle_id") references "rolle" ("id") on update cascade on delete set null;',
        );
        this.addSql(
            'alter table "importvorgang" add constraint "importvorgang_organisation_id_foreign" foreign key ("organisation_id") references "organisation" ("id") on update cascade on delete set null;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importvorgang" drop constraint "importvorgang_person_id_foreign";');
        this.addSql('alter table "importvorgang" drop constraint "importvorgang_rolle_id_foreign";');
        this.addSql('alter table "importvorgang" drop constraint "importvorgang_organisation_id_foreign";');
        this.addSql('alter table "importvorgang" rename column "person_id" to "import_by_person_id";');
    }
}
