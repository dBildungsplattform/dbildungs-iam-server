import { Migration } from '@mikro-orm/migrations';

export class Migration20240918113026 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "organisation" add column "emaildomain" varchar(255) null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "organisation" drop column "emaildomain";');
  }

}
