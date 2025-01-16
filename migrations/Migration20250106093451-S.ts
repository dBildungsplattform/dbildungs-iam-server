import { Migration } from '@mikro-orm/migrations';

export class Migration20250106093451 extends Migration {
    public async up(): Promise<void> {
        // Add NOT NULL and default constraints
        this.addSql('alter table "importdataitem" alter column "status" set not null;');
        this.addSql('alter table "importdataitem" alter column "status" set default \'PENDING\';');
    }

    public override async down(): Promise<void> {
        // Remove the constraints and reset the column to nullable
        this.addSql('alter table "importdataitem" alter column "status" drop default;');
        this.addSql('alter table "importdataitem" alter column "status" drop not null;');

        // Optionally reset updated statuses to null (depends on use case)
        this.addSql('update "importdataitem" set "status" = null;');
    }
}
