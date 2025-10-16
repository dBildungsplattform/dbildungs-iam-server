import { Migration } from '@mikro-orm/migrations';

export class Migration20251007101017 extends Migration {
    async up(): Promise<void> {
        this.addSql('create schema if not exists "email";');
        this.addSql(
            "create type \"email\".\"email_address_status_enum\" as enum ('PENDING', 'ACTIVE', 'DEACTIVE', 'SUSPENDED', 'TO_BE_DELETED');",
        );
        this.addSql(
            'create table "email"."address" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "address" varchar(255) not null, "priority" int not null, "ox_user_id" varchar(255) null, "spsh_person_id" varchar(255) null, "marked_for_cron" timestamptz null, constraint "address_pkey" primary key ("id"));',
        );
        this.addSql('alter table "email"."address" add constraint "address_address_unique" unique ("address");');
        this.addSql('create index "email_address_spsh_person_id_index" on "email"."address" ("spsh_person_id");');

        this.addSql(
            'create table "email"."address_status" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email_address_id" uuid not null, "status" "email"."email_address_status_enum" not null, constraint "address_status_pkey" primary key ("id"));',
        );
        this.addSql('create index "email_address_id" on "email"."address_status" using hash ("email_address_id");');

        this.addSql(
            'create table "email"."domain" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "domain" varchar(255) not null, constraint "domain_pkey" primary key ("id"));',
        );

        this.addSql(
            'alter table "email"."address_status" add constraint "address_status_email_address_id_foreign" foreign key ("email_address_id") references "email"."address" ("id") on update cascade;',
        );

        this.addSql('alter type "referenced_entity_type_enum" add value if not exists \'EMAIL_DOMAIN\';');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "email"."address_status" drop constraint "address_status_email_address_id_foreign";');

        this.addSql('drop table if exists "email"."address" cascade;');

        this.addSql('drop table if exists "email"."address_status" cascade;');

        this.addSql('drop table if exists "email"."domain" cascade;');

        this.addSql('drop type "email"."email_address_status_enum";');
        this.addSql('drop schema if exists "email";');
    }
}
