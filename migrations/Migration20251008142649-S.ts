import { Migration } from '@mikro-orm/migrations';

export class Migration20251008142649 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'alter table "schulstrukturknoten" drop constraint "schulstrukturknoten_administrative_parent_id_foreign";',
        );

        this.addSql(
            'alter table "schulstrukturknoten" drop constraint "schulstrukturknoten_organizational_parent_id_foreign";',
        );

        this.addSql('drop table if exists "benachrichtigung" cascade;');

        this.addSql('drop table if exists "authentication_provider" cascade;');

        this.addSql('drop table if exists "schulstrukturknoten" cascade;');

        this.addSql(
            'alter table "person" drop column "initialen_familienname", drop column "initialen_vorname", drop column "rufname", drop column "name_titel", drop column "name_anrede", drop column "name_praefix", drop column "name_suffix", drop column "name_sortierindex", drop column "geburtsdatum", drop column "geburtsort", drop column "geschlecht", drop column "lokalisierung", drop column "vertrauensstufe", drop column "auskunftssperre";',
        );

        this.addSql('drop type "geschlecht_enum";');
        this.addSql('drop type "vertrauensstufe_enum";');
    }

    public override async down(): Promise<void> {
        this.addSql("create type \"geschlecht_enum\" as enum ('m', 'w', 'd', 'x');");
        this.addSql("create type \"vertrauensstufe_enum\" as enum ('KEIN', 'UNBE', 'TEIL', 'VOLL');");
        this.addSql(
            'create table "benachrichtigung" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "source" uuid not null, "target" uuid not null, constraint "benachrichtigung_pkey" primary key ("id"));',
        );

        this.addSql(
            'create table "authentication_provider" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "data_provider_id" uuid not null, constraint "authentication_provider_pkey" primary key ("id"));',
        );

        this.addSql(
            'create table "schulstrukturknoten" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "administrative_parent_id" uuid not null, "organizational_parent_id" uuid not null, "data_provider" uuid not null, "node_type" text check ("node_type" in (\'traeger\', \'organisation\', \'group\')) not null, constraint "schulstrukturknoten_pkey" primary key ("id"));',
        );
        this.addSql(
            'alter table "schulstrukturknoten" add constraint "schulstrukturknoten_administrative_parent_id_unique" unique ("administrative_parent_id");',
        );
        this.addSql(
            'alter table "schulstrukturknoten" add constraint "schulstrukturknoten_organizational_parent_id_unique" unique ("organizational_parent_id");',
        );
        this.addSql('create index "schulstrukturknoten_node_type_index" on "schulstrukturknoten" ("node_type");');

        this.addSql(
            'alter table "authentication_provider" add constraint "authentication_provider_data_provider_id_foreign" foreign key ("data_provider_id") references "data_provider" ("id") on update cascade;',
        );

        this.addSql(
            'alter table "schulstrukturknoten" add constraint "schulstrukturknoten_administrative_parent_id_foreign" foreign key ("administrative_parent_id") references "schulstrukturknoten" ("id") on update cascade;',
        );
        this.addSql(
            'alter table "schulstrukturknoten" add constraint "schulstrukturknoten_organizational_parent_id_foreign" foreign key ("organizational_parent_id") references "schulstrukturknoten" ("id") on update cascade;',
        );

        this.addSql(
            'alter table "person" add column "initialen_familienname" varchar(255) null, add column "initialen_vorname" varchar(255) null, add column "rufname" varchar(255) null, add column "name_titel" varchar(255) null, add column "name_anrede" text[] null, add column "name_praefix" text[] null, add column "name_suffix" text[] null, add column "name_sortierindex" varchar(255) null, add column "geburtsdatum" timestamptz null, add column "geburtsort" varchar(255) null, add column "geschlecht" "geschlecht_enum" null, add column "lokalisierung" varchar(255) null, add column "vertrauensstufe" "vertrauensstufe_enum" null, add column "auskunftssperre" boolean null;',
        );
    }
}
