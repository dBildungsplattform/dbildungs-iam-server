import { Migration } from '@mikro-orm/migrations';

export class Migration20241114102951 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "organisation" add column "is_enabled_for_its_learning" boolean not null default false;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "organisation" drop column "is_enabled_for_its_learning";');
  }

}
