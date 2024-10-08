import { Migration } from '@mikro-orm/migrations';

// This migration is split into two (Migration20241008115945, Migration20241008115946), because each migration is a
// transaction and changes to enums need to be committed before use.
export class Migration20241008115946 extends Migration {
    public async up(): Promise<void> {
        // Add systemrecht to all SYSADMIN rollen
        this.addSql(
            `INSERT INTO rolle_systemrecht (
                rolle_id,
                systemrecht
            ) SELECT
                id AS rolle_id,
                'PERSON_SYNCHRONISIEREN'::rollen_system_recht_enum AS systemrecht
            FROM rolle
            WHERE rollenart = 'SYSADMIN'
            ON CONFLICT DO NOTHING;`,
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            `DELETE FROM rolle_systemrecht WHERE systemrecht = 'PERSON_SYNCHRONISIEREN'::rollen_system_recht_enum;`,
        );
    }
}
