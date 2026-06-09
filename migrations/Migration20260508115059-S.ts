import { Migration } from '@mikro-orm/migrations';

export class Migration20260508115059 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "service_provider" alter column "url" type text using ("url"::text);');
    }

    override async down(): Promise<void> {
        this.addSql('alter table "service_provider" alter column "url" type varchar(255) using ("url"::varchar(255));');
    }
}
