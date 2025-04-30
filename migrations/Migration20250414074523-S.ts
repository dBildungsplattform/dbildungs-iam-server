import { Migration } from '@mikro-orm/migrations';

export class Migration20250414074523 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter table "external_id_mapping" drop constraint "external_id_mapping_person_id_foreign";');

        this.addSql('alter table "personenkontext" drop constraint "personenkontext_person_id_foreign";');

        this.addSql('alter table "user_lock" drop constraint "user_lock_person_id_foreign";');

        this.addSql(
            'alter table "external_id_mapping" add constraint "external_id_mapping_person_id_foreign" foreign key ("person_id") references "person" ("id") on update cascade on delete cascade;',
        );

        this.addSql(
            'alter table "personenkontext" add constraint "personenkontext_person_id_foreign" foreign key ("person_id") references "person" ("id") on update cascade on delete cascade;',
        );

        this.addSql(
            'alter table "user_lock" add constraint "user_lock_person_id_foreign" foreign key ("person_id") references "person" ("id") on update cascade on delete cascade;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "external_id_mapping" drop constraint "external_id_mapping_person_id_foreign";');

        this.addSql('alter table "personenkontext" drop constraint "personenkontext_person_id_foreign";');

        this.addSql('alter table "user_lock" drop constraint "user_lock_person_id_foreign";');

        this.addSql(
            'alter table "external_id_mapping" add constraint "external_id_mapping_person_id_foreign" foreign key ("person_id") references "person" ("id") on delete cascade;',
        );

        this.addSql(
            'alter table "personenkontext" add constraint "personenkontext_person_id_foreign" foreign key ("person_id") references "person" ("id") on delete cascade;',
        );

        this.addSql(
            'alter table "user_lock" add constraint "user_lock_person_id_foreign" foreign key ("person_id") references "person" ("id") on delete cascade;',
        );
    }
}
