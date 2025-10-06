import { Migration } from '@mikro-orm/migrations';

export class Migration20251006114114 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "person" drop column "initialen_familienname", drop column "initialen_vorname", drop column "rufname", drop column "geburtsdatum", drop column "geburtsort", drop column "geschlecht", drop column "vertrauensstufe", drop column "auskunftssperre";');

    this.addSql('drop type "geschlecht_enum";');
    this.addSql('drop type "vertrauensstufe_enum";');
  }

  override async down(): Promise<void> {
    this.addSql('create type "geschlecht_enum" as enum (\'m\', \'w\', \'d\', \'x\');');
    this.addSql('create type "vertrauensstufe_enum" as enum (\'KEIN\', \'UNBE\', \'TEIL\', \'VOLL\');');
    this.addSql('alter table "person" add column "initialen_familienname" varchar(255) null, add column "initialen_vorname" varchar(255) null, add column "rufname" varchar(255) null, add column "geburtsdatum" timestamptz null, add column "geburtsort" varchar(255) null, add column "geschlecht" "geschlecht_enum" null, add column "vertrauensstufe" "vertrauensstufe_enum" null, add column "auskunftssperre" boolean null;');
  }

}
