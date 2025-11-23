import { Migration } from '@mikro-orm/migrations';

export class Migration20251119184851 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'alter table "email"."address" alter column "external_id" type varchar(255) using ("external_id"::varchar(255));',
        );
        this.addSql('alter table "email"."address" alter column "external_id" set not null;');
        this.addSql(
            'alter table "email"."address" alter column "spsh_person_id" type varchar(255) using ("spsh_person_id"::varchar(255));',
        );
        this.addSql('alter table "email"."address" alter column "spsh_person_id" set not null;');
    }

    public override async down(): Promise<void> {
        this.addSql(
            'alter table "email"."address" alter column "external_id" type varchar(255) using ("external_id"::varchar(255));',
        );
        this.addSql('alter table "email"."address" alter column "external_id" drop not null;');
        this.addSql(
            'alter table "email"."address" alter column "spsh_person_id" type varchar(255) using ("spsh_person_id"::varchar(255));',
        );
        this.addSql('alter table "email"."address" alter column "spsh_person_id" drop not null;');
    }
}
