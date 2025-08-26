import { Migration } from '@mikro-orm/migrations';

export class Migration20250820113003 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'create table "rollenerweiterung" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "organisation_id" uuid not null, "rolle_id" uuid not null, "service_provider_id" uuid not null, constraint "rollenerweiterung_pkey" primary key ("id"));',
        );
        this.addSql(
            'create index "rolle_erweiterung_organisation_id_index" on "rollenerweiterung" using hash ("organisation_id");',
        );
        this.addSql('create index "rolle_erweiterung_rolle_id_index" on "rollenerweiterung" using hash ("rolle_id");');
        this.addSql(
            'create index "rolle_erweiterung_service_provider_id_index" on "rollenerweiterung" using hash ("service_provider_id");',
        );
        this.addSql(
            'alter table "rollenerweiterung" add constraint "rollenerweiterung_organisation_id_rolle_id_service_8581c_unique" unique ("organisation_id", "rolle_id", "service_provider_id");',
        );

        this.addSql(
            'alter table "rollenerweiterung" add constraint "rollenerweiterung_organisation_id_foreign" foreign key ("organisation_id") references "organisation" ("id") on update cascade;',
        );
        this.addSql(
            'alter table "rollenerweiterung" add constraint "rollenerweiterung_rolle_id_foreign" foreign key ("rolle_id") references "rolle" ("id") on update cascade;',
        );
        this.addSql(
            'alter table "rollenerweiterung" add constraint "rollenerweiterung_service_provider_id_foreign" foreign key ("service_provider_id") references "service_provider" ("id") on update cascade;',
        );
    }

    override async down(): Promise<void> {
        this.addSql('drop table if exists "rollenerweiterung" cascade;');
    }
}
