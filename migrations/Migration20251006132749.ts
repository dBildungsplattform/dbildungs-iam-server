import { Migration } from '@mikro-orm/migrations';

export class Migration20251006132749 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "person" drop column "name_titel", drop column "name_anrede", drop column "name_praefix", drop column "name_suffix", drop column "name_sortierindex", drop column "lokalisierung";');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "person" add column "name_titel" varchar(255) null, add column "name_anrede" text[] null, add column "name_praefix" text[] null, add column "name_suffix" text[] null, add column "name_sortierindex" varchar(255) null, add column "lokalisierung" varchar(255) null;');
  }

}
