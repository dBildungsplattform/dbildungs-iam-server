import { Migration } from '@mikro-orm/migrations';

export class Migration20250104001707 extends Migration {
    public async up(): Promise<void> {
        // Create the enum type for the status
        this.addSql("create type \"import_data_item_status_enum\" as enum ('FAILED', 'SUCCESS', 'PENDING');");

        // Add the status column, allowing NULL initially to avoid issues during the update
        this.addSql('alter table "importdataitem" add column "status" "import_data_item_status_enum";');

        // Update the status of items where the related importvorgang has status 'FINISHED'
        this.addSql(`
            update "importdataitem" di
            set "status" = 'SUCCESS'
            from "importvorgang" iv
            where di."importvorgang_id" = iv.id
              and iv."status" = 'FINISHED';
        `);

        // Set the remaining rows to 'PENDING' as a fallback
        this.addSql('update "importdataitem" set "status" = \'PENDING\' where "status" is null;');

        // Make the column NOT NULL and add a default value
        this.addSql('alter table "importdataitem" alter column "status" set not null;');
        this.addSql('alter table "importdataitem" alter column "status" set default \'PENDING\';');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importdataitem" drop column "status";');

        this.addSql('drop type "import_data_item_status_enum";');
    }
}
