import { Migration } from '@mikro-orm/migrations';

export class Migration20251016132038 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "email"."address" add column "ldap_entry_uuid" varchar(255) null;');

        this.addSql('alter type "email"."email_address_status_enum" add value if not exists \'FAILED\';');

        this.addSql('alter type "email"."email_address_status_enum" add value if not exists \'EXISTS_ONLY_IN_OX\';');
    }

    override async down(): Promise<void> {
        this.addSql('alter table "email"."address" drop column "ldap_entry_uuid";');
    }
}
