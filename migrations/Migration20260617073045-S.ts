import { Migration } from '@mikro-orm/migrations';

export class Migration20260617073045 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "email_address" alter column "status" set not null;`);

    this.addSql(`alter type "rollen_system_recht_enum" add value if not exists 'SCHULISCHE_VIDIS_ANGEBOTE_ABRUFEN' after 'ANGEBOTE_EINGESCHRAENKT_VERWALTEN';`);

    this.addSql(`alter table "service_provider" alter column "requires2fa" drop default;`);
    this.addSql(`alter table "service_provider" alter column "requires2fa" set not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "email"."address_status" alter column "status" type "email"."email_address_status_enum" using ("status"::"email"."email_address_status_enum");`);

    this.addSql(`alter table "email_address" alter column "status" drop not null;`);

    this.addSql(`alter type "rollen_system_recht_enum" add value if not exists 'MIGRATION_DURCHFUEHREN' after 'SCHULTRAEGER_VERWALTEN';`);

    this.addSql(`alter table "service_provider" alter column "requires2fa" set default false;`);
    this.addSql(`alter table "service_provider" alter column "requires2fa" drop not null;`);
  }

}
