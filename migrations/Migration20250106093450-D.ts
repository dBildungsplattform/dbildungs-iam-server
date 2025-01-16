import { Migration } from '@mikro-orm/migrations';

export class Migration20250106093450 extends Migration {
    public async up(): Promise<void> {
        // Update the status for existing records based on `importvorgang`
        this.addSql(`
            UPDATE "importdataitem" 
            SET "status" = 'SUCCESS'
            WHERE "importvorgang_id" IN (
                SELECT "id"
                FROM "importvorgang"
                WHERE "status" = 'FINISHED'
            );
        `);

        // Set default for remaining records
        this.addSql('update "importdataitem" set "status" = \'PENDING\' where "status" is null;');

        // Add NOT NULL and default constraints
        this.addSql('alter table "importdataitem" alter column "status" set not null;');
        this.addSql('alter table "importdataitem" alter column "status" set default \'PENDING\';');
    }

    public override async down(): Promise<void> {}
}
