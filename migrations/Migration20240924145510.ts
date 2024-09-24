import { Migration } from '@mikro-orm/migrations';

export class Migration20240924145510 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "email_address" add column "ox_user_id" varchar(255) null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "email_address" drop column "ox_user_id";');
  }

}
