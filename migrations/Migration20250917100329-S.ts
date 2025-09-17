import { Migration } from '@mikro-orm/migrations';

export class Migration20250917100329 extends Migration {
    public async up(): Promise<void> {
        this.addSql('create schema if not exists "email";');
        this.addSql(
            "create type \"email\".\"email_address_new_status_enum\" as enum ('ACTIVE', 'DEACTIVE', 'UNASSIGNED', 'FAILED');",
        );
        this.addSql(
            'create table "email"."address" ("id" uuid not null, "address" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "priority" int not null, "status" "email"."email_address_new_status_enum" not null, "ox_user_id" varchar(255) null, "spsh_person_id" varchar(255) null, "marked_for_cron" timestamptz null, constraint "address_pkey" primary key ("id", "address"));',
        );
        this.addSql('alter table "email"."address" add constraint "address_address_unique" unique ("address");');
        this.addSql('create index "email_address_spsh_person_id_index" on "email"."address" ("spsh_person_id");');
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists "email"."address" cascade;');

        this.addSql('drop type "email"."email_address_new_status_enum";');
        this.addSql('drop schema if exists "email";');
    }
}
