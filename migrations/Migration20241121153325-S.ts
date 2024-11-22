import { Migration } from '@mikro-orm/migrations';

export class Migration20241121153325 extends Migration {
    public async up(): Promise<void> {
        this.addSql('CREATE COLLATION alphanumeric (provider = icu, locale = "de-u-kn-true");');
        this.addSql('ALTER TABLE organisation ALTER COLUMN name TYPE character varying(255) COLLATE alphanumeric');
        this.addSql('ALTER TABLE organisation ALTER COLUMN kennung TYPE character varying(255) COLLATE alphanumeric');
    }

    public override async down(): Promise<void> {
        this.addSql(
            'ALTER TABLE organisation ALTER COLUMN name TYPE character varying(255) COLLATE pg_catalog."default"',
        );
        this.addSql(
            'ALTER TABLE organisation ALTER COLUMN kennung TYPE character varying(255) COLLATE pg_catalog."default"',
        );
    }
}
