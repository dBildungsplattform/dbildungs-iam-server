import { Migration } from '@mikro-orm/migrations';

// This migration is split into two (Migration20241008115945, Migration20241008115946), because each migration is a
// transaction and changes to enums need to be committed before use.
export class Migration20241008115945 extends Migration {
    public async up(): Promise<void> {
        this.addSql(`ALTER TYPE "rollen_system_recht_enum" ADD VALUE IF NOT EXISTS 'PERSON_SYNCHRONISIEREN';`);
    }
}
