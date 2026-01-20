import { Migration } from '@mikro-orm/migrations';

export class Migration20250725113557 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            `DELETE FROM SERVICE_PROVIDER_MERKMAL WHERE SERVICE_PROVIDER_ID IN ( SELECT ID FROM SERVICE_PROVIDER WHERE "name" IN ('Kalender', 'Adressbuch'));`,
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            `INSERT INTO SERVICE_PROVIDER_MERKMAL SELECT ID, 'NACHTRAEGLICH_ZUWEISBAR' FROM SERVICE_PROVIDER WHERE NAME IN ('Kalender', 'Adressbuch');`,
        );
    }
}
