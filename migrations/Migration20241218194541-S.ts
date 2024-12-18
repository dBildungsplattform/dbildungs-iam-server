import { Migration } from '@mikro-orm/migrations';

export class Migration20241218194541 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter table "importvorgang" add column "total_data_item_imported" int not null;');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importvorgang" drop column "total_data_item_imported";');
    }
}
