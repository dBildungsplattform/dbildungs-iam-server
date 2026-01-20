import { Migration } from '@mikro-orm/migrations';

export class Migration20251023084748 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "email"."address" add column "external_id" varchar(255) null;');
        this.addSql('alter table "email"."address" rename column "ox_user_id" to "ox_user_counter";');
        this.addSql('create index "email_address_spsh_external_id_index" on "email"."address" ("external_id");');

        this.addSql('alter type "email"."email_address_status_enum" add value if not exists \'FAILED\';');

        this.addSql('alter type "email"."email_address_status_enum" add value if not exists \'EXISTS_ONLY_IN_OX\';');
    }

    override async down(): Promise<void> {
        this.addSql('drop index "email"."email_address_spsh_external_id_index";');
        this.addSql('alter table "email"."address" drop column "external_id";');

        this.addSql('alter table "email"."address" rename column "ox_user_counter" to "ox_user_id";');
    }
}
