import { Migration } from '@mikro-orm/migrations';

export class Migration20241207145859 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'create table "ox_user_blacklist" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "name" varchar(255) not null, "username" varchar(255) not null, constraint "ox_user_blacklist_pkey" primary key ("id"));',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists "ox_user_blacklist" cascade;');
    }
}
