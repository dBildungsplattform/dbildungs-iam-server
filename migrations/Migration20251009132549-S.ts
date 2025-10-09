import { Migration } from '@mikro-orm/migrations';

export class Migration20251009132549 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'ANGEBOTE_VERWALTEN\';');
    }
}
