import { Migration } from '@mikro-orm/migrations';

export class Migration20241207094524 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'PERSONEN_LESEN\';');
        this.addSql("update rolle set ist_technisch = true where name = 'Technical User NextCloud';");
    }
}
