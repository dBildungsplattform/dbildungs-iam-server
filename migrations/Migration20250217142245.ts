import { Migration } from '@mikro-orm/migrations';

export class Migration20250217142245 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "meldung" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "inhalt" varchar(2000) not null, "status" text check ("status" in (\'veroeffentlicht\', \'nicht_veroeffentlicht\')) not null default \'nicht_veroeffentlicht\', "revision" int not null default 1, constraint "meldung_pkey" primary key ("id"));');
    this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'SCHULPORTAL_VERWALTEN\';');
    this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'HINWEISE_BEARBEITEN\';');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "meldung" cascade;');
  }

}
