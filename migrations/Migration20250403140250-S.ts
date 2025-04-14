import { Migration } from '@mikro-orm/migrations';

export class Migration20250403140250 extends Migration {
    public async up(): Promise<void> {
        this.addSql('create type "external_id_enum" as enum (\'LDAP\');');
        this.addSql(
            'create table "external_id_mapping" ("person_id" uuid not null, "type" "external_id_enum" not null, "external_id" varchar(255) not null, constraint "external_id_mapping_pkey" primary key ("person_id", "type"));',
        );

        this.addSql(
            'alter table "external_id_mapping" add constraint "external_id_mapping_person_id_foreign" foreign key ("person_id") references "person" ("id") on delete cascade;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists "external_id_mapping" cascade;');

        this.addSql('drop type "external_id_enum";');
    }
}
