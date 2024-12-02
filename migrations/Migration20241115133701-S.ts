import { Migration } from '@mikro-orm/migrations';

export class Migration20241115133701 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'create table "organisation_service_provider" ("organisation_id" uuid not null, "service_provider_id" uuid not null, constraint "organisation_service_provider_pkey" primary key ("organisation_id", "service_provider_id"));',
        );

        this.addSql(
            'alter table "organisation_service_provider" add constraint "organisation_service_provider_organisation_id_foreign" foreign key ("organisation_id") references "organisation" ("id") on update cascade;',
        );
        this.addSql(
            'alter table "organisation_service_provider" add constraint "organisation_service_provider_service_provider_id_foreign" foreign key ("service_provider_id") references "service_provider" ("id") on update cascade;',
        );
    }

    override async down(): Promise<void> {
        this.addSql('drop table if exists "organisation_service_provider" cascade;');
    }
}
