import { Migration } from '@mikro-orm/migrations';

export class Migration20251009085031 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "person" rename column "referrer" to "username";');

        this.addSql('alter table "personenkontext" rename column "referrer" to "username";');
    }

    override async down(): Promise<void> {
        this.addSql('alter table "person" rename column "username" to "referrer";');

        this.addSql('alter table "personenkontext" rename column "username" to "referrer";');
    }
}
