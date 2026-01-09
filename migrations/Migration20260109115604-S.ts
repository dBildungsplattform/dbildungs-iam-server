import { Migration } from '@mikro-orm/migrations';

export class Migration20260109115604 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter type "service_provider_kategorie_enum" add value if not exists \'SCHULISCH\';');
    }
}
