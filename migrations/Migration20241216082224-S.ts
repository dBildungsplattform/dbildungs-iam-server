import { Migration } from '@mikro-orm/migrations';

export class Migration20241216082224 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter table "service_provider" add column "vidis_angebot_id" varchar(255) null;');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "service_provider" drop column "vidis_angebot_id";');
    }
}
