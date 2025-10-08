import { Migration } from '@mikro-orm/migrations';

export class Migration20251008123525 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "schulstrukturknoten" drop constraint "schulstrukturknoten_administrative_parent_id_foreign";');

    this.addSql('alter table "schulstrukturknoten" drop constraint "schulstrukturknoten_organizational_parent_id_foreign";');

    this.addSql('drop table if exists "benachrichtigung" cascade;');

    this.addSql('drop table if exists "authentication_provider" cascade;');

    this.addSql('drop table if exists "schulstrukturknoten" cascade;');

    this.addSql('alter table "person" rename column "referrer" to "username";');

    this.addSql('alter table "personenkontext" rename column "referrer" to "username";');
  }

  override async down(): Promise<void> {
    this.addSql('create table "benachrichtigung" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "source" uuid not null, "target" uuid not null, constraint "benachrichtigung_pkey" primary key ("id"));');

    this.addSql('create table "authentication_provider" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "data_provider_id" uuid not null, constraint "authentication_provider_pkey" primary key ("id"));');

    this.addSql('create table "schulstrukturknoten" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "administrative_parent_id" uuid not null, "organizational_parent_id" uuid not null, "data_provider" uuid not null, "node_type" text check ("node_type" in (\'traeger\', \'organisation\', \'group\')) not null, constraint "schulstrukturknoten_pkey" primary key ("id"));');
    this.addSql('alter table "schulstrukturknoten" add constraint "schulstrukturknoten_administrative_parent_id_unique" unique ("administrative_parent_id");');
    this.addSql('alter table "schulstrukturknoten" add constraint "schulstrukturknoten_organizational_parent_id_unique" unique ("organizational_parent_id");');
    this.addSql('create index "schulstrukturknoten_node_type_index" on "schulstrukturknoten" ("node_type");');

    this.addSql('alter table "authentication_provider" add constraint "authentication_provider_data_provider_id_foreign" foreign key ("data_provider_id") references "data_provider" ("id") on update cascade;');

    this.addSql('alter table "schulstrukturknoten" add constraint "schulstrukturknoten_administrative_parent_id_foreign" foreign key ("administrative_parent_id") references "schulstrukturknoten" ("id") on update cascade;');
    this.addSql('alter table "schulstrukturknoten" add constraint "schulstrukturknoten_organizational_parent_id_foreign" foreign key ("organizational_parent_id") references "schulstrukturknoten" ("id") on update cascade;');

    this.addSql('alter table "person" rename column "username" to "referrer";');

    this.addSql('alter table "personenkontext" rename column "username" to "referrer";');
  }

}
