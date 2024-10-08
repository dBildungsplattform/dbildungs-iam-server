import { Migration } from '@mikro-orm/migrations';

export class Migration20241008115945 extends Migration {
    public async up(): Promise<void> {
        this.addSql(`ALTER TYPE "rollen_system_recht_enum" ADD VALUE IF NOT EXISTS 'PERSON_SYNCHRONISIEREN';`);

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
        // Removing a value from an enum is not supported in postgres
        // We just remove the added systemrechte again
        this.addSql(
            `DELETE FROM rolle_systemrecht WHERE systemrecht = 'PERSON_SYNCHRONISIEREN'::rollen_system_recht_enum;`,
        );
    }
}
