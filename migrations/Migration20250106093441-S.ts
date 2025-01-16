import { Migration } from '@mikro-orm/migrations';

export class Migration20250106093441 extends Migration {
    public async up(): Promise<void> {
        // Create the enum type
        this.addSql("create type \"import_data_item_status_enum\" as enum ('FAILED', 'SUCCESS', 'PENDING');");

        // Add the column with the enum type (nullable for now)
        this.addSql('alter table "importdataitem" add column "status" "import_data_item_status_enum";');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importdataitem" drop column "status";');
        this.addSql('drop type "import_data_item_status_enum";');
    }
}
