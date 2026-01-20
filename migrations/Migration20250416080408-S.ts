import { Migration } from '@mikro-orm/migrations';

export class Migration20250416080408 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter type "email_address_status_enum" add value if not exists \'DELETED_LDAP\';');

        this.addSql('alter type "email_address_status_enum" add value if not exists \'DELETED_OX\';');

        this.addSql('alter type "email_address_status_enum" add value if not exists \'DELETED\';');
    }
}
