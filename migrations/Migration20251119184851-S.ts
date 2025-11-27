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

        this.addSql('alter table "email"."address_status" drop constraint "address_status_email_address_id_foreign";');

        this.addSql(
            'alter table "email"."address_status" add constraint "address_status_email_address_id_foreign" foreign key ("email_address_id") references "email"."address" ("id") on update cascade on delete cascade;',
        );
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

        this.addSql('alter table "email"."address_status" drop constraint "address_status_email_address_id_foreign";');

        this.addSql(
            'alter table "email"."address_status" add constraint "address_status_email_address_id_foreign" foreign key ("email_address_id") references "email"."address" ("id") on update cascade;',
        );
    }
}
