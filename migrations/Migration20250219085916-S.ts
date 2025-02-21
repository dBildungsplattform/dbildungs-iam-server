import { Migration } from '@mikro-orm/migrations';

export class Migration20250219085916 extends Migration {
    public async up(): Promise<void> {
        this.addSql('ALTER TABLE person ALTER COLUMN referrer TYPE character varying(255) COLLATE alphanumeric');
    }

    public override async down(): Promise<void> {
        this.addSql(
            'ALTER TABLE person ALTER COLUMN referrer TYPE character varying(255) COLLATE pg_catalog."default"',
        );
    }
}
