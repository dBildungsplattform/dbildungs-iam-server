import { Migration } from '@mikro-orm/migrations';

export class Migration20251120103301 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'alter table "email"."address" alter column "external_id" type varchar(255) using ("external_id"::varchar(255));',
        );
        this.addSql('alter table "email"."address" alter column "external_id" set not null;');
    }

    override async down(): Promise<void> {
        this.addSql(
            'alter table "email"."address" alter column "external_id" type varchar(255) using ("external_id"::varchar(255));',
        );
        this.addSql('alter table "email"."address" alter column "external_id" drop not null;');
    }
}
