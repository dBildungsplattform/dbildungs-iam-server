import { Migration } from '@mikro-orm/migrations';

export class Migration20260323130058S extends Migration {

  override async up(): Promise<void> {
    this.addSql('create unique index "person_username_unique" on "person" ("username") nulls distinct;;');
  }

  override async down(): Promise<void> {
    this.addSql('drop index "person_username_unique";');
  }

}
