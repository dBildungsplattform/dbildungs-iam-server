import { Migration } from '@mikro-orm/migrations';

export class Migration20250818132623 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'alter type "service_provider_merkmal_enum" add value if not exists \'VERFUEGBAR_FUER_ROLLENERWEITERUNG\';',
        );
    }
}
