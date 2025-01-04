import { Migration } from '@mikro-orm/migrations';

export class Migration20250104001707 extends Migration {
    public async up(): Promise<void> {
        this.addSql("create type \"import_data_item_status_enum\" as enum ('FAILED', 'SUCCESS', 'PENDING');");
        this.addSql(
            'alter table "importdataitem" add column "data_item_status" "import_data_item_status_enum" not null;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importdataitem" drop column "data_item_status";');

        this.addSql('drop type "import_data_item_status_enum";');
    }
}
