import { Migration } from '@mikro-orm/migrations';

export class Migration20260213092313 extends Migration {

 public async up(): Promise<void> {

    this.addSql(`
      create type "service_provider_kategorie_enum_new" as enum (
        'EMAIL',
        'UNTERRICHT',
        'VERWALTUNG',
        'HINWEISE',
        'SCHULISCH'
      );
    `);

    this.addSql(`
      alter table "service_provider"
      alter column "kategorie"
      type "service_provider_kategorie_enum_new"
      using ("kategorie"::text::"service_provider_kategorie_enum_new");
    `);

    this.addSql(`drop type "service_provider_kategorie_enum";`);

    this.addSql(`
      alter type "service_provider_kategorie_enum_new"
      rename to "service_provider_kategorie_enum";
    `);
  }
}
