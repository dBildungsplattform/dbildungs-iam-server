import { Migration } from '@mikro-orm/migrations';

export class Migration20250923123856 extends Migration {
    public async up(): Promise<void> {
        this.addSql('create schema if not exists "email";');
        this.addSql('create type "email"."email_address_status_enum" as enum (\'PENDING\');');
        this.addSql(
            'create table "email"."domain" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "domain" varchar(255) not null, constraint "domain_pkey" primary key ("id"));',
        );

        this.addSql(
            'create table "email"."address" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "address" varchar(255) not null, "priority" int not null, "status" "email"."email_address_status_enum" not null, "ox_user_id" varchar(255) null, "spsh_person_id" varchar(255) null, "marked_for_cron" timestamptz null, constraint "address_pkey" primary key ("id"));',
        );
        this.addSql('alter table "email"."address" add constraint "address_address_unique" unique ("address");');
        this.addSql('create index "email_address_spsh_person_id_index" on "email"."address" ("spsh_person_id");');

        this.addSql(`
        ALTER TABLE email.address
        ADD CONSTRAINT email_address_markedforcron_check
        CHECK (
            (priority = 0 AND status = 'ACTIVE' AND marked_for_cron IS NULL)
            OR
            (status = 'REQUESTED' AND marked_for_cron IS NULL)
            OR
            (
                NOT (
                    (priority = 0 AND status = 'ACTIVE')
                    OR
                    (status = 'REQUESTED')
                )
                AND marked_for_cron IS NOT NULL
            )
        );
        `);
    }

    public override async down(): Promise<void> {
        this.addSql('ALTER TABLE "email"."address" DROP CONSTRAINT IF EXISTS email_address_markedforcron_check;');
        this.addSql('drop table if exists "email"."domain" cascade;');

        this.addSql('drop table if exists "email"."address" cascade;');

        this.addSql('drop type "email"."email_address_status_enum";');
        this.addSql('drop schema if exists "email";');
    }
}
