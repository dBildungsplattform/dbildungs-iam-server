import { Migration } from '@mikro-orm/migrations';

export class Migration20251127091910 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "email"."address_status" drop constraint "address_status_email_address_id_foreign";');

    this.addSql('alter table "email"."address_status" add constraint "address_status_email_address_id_foreign" foreign key ("email_address_id") references "email"."address" ("id") on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "email"."address_status" drop constraint "address_status_email_address_id_foreign";');

    this.addSql('alter table "email"."address_status" add constraint "address_status_email_address_id_foreign" foreign key ("email_address_id") references "email"."address" ("id") on update cascade;');
  }

}
