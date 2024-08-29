import { Migration } from '@mikro-orm/migrations';

export class Migration20240829100726 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "personenkontext" add column "befristung" timestamptz null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "personenkontext" drop column "befristung";');
  }

}
