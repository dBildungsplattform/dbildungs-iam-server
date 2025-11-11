import { Migration } from '@mikro-orm/migrations';

export class Migration20251111093256 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "email"."domain" add column "spsh_service_provider_id" uuid not null;');
    }

    override async down(): Promise<void> {
        this.addSql('alter table "email"."domain" drop column "spsh_service_provider_id";');
    }
}
