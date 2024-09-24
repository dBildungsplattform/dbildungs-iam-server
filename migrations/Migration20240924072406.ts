import { Migration } from '@mikro-orm/migrations';

export class Migration20240924072406 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'create table "user_lock" ("id" uuid not null, "person_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "locked_by" varchar(255) null, "locked_until" timestamptz null, constraint "user_lock_pkey" primary key ("id", "person_id"));',
        );
    }

    override async down(): Promise<void> {
        this.addSql('drop table if exists "user_lock" cascade;');
    }
}
