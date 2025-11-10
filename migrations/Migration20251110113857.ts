import { Migration } from '@mikro-orm/migrations';

export class Migration20251110113857 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "email"."domain" alter column "spsh_service_provider_id" drop default;');
        this.addSql(
            'alter table "email"."domain" alter column "spsh_service_provider_id" type uuid using ("spsh_service_provider_id"::text::uuid);',
        );
    }

    override async down(): Promise<void> {
        this.addSql(
            'alter table "email"."domain" alter column "spsh_service_provider_id" type text using ("spsh_service_provider_id"::text);',
        );

        this.addSql(
            'alter table "email"."domain" alter column "spsh_service_provider_id" type varchar(255) using ("spsh_service_provider_id"::varchar(255));',
        );
    }
}
