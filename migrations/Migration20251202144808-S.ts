import { Migration } from '@mikro-orm/migrations';

export class Migration20251202144808 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter type "referenced_entity_type_enum" add value if not exists \'ROLLENERWEITERUNG\';');
    }
}
