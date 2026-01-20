import { Migration } from '@mikro-orm/migrations';

export class Migration20250725113557 extends Migration {
    public async up(): Promise<void> {
        this.addSql('create type "service_provider_merkmal_enum" as enum (\'NACHTRAEGLICH_ZUWEISBAR\');');
        this.addSql(
            'create table "service_provider_merkmal" ("service_provider_id" uuid not null, "merkmal" "service_provider_merkmal_enum" not null, constraint "service_provider_merkmal_pkey" primary key ("service_provider_id", "merkmal"));',
        );
        this.addSql(
            'create index "service_provider_merkmal_service_provider_id_index" on "service_provider_merkmal" ("service_provider_id");',
        );

        this.addSql(
            'alter table "service_provider_merkmal" add constraint "service_provider_merkmal_service_provider_id_foreign" foreign key ("service_provider_id") references "service_provider" ("id") on update cascade;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists "service_provider_merkmal" cascade;');

        this.addSql('drop type "service_provider_merkmal_enum";');
    }
}
