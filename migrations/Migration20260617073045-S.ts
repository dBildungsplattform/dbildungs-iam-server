import { Migration } from '@mikro-orm/migrations';

export class Migration20260617073045 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter type "rollen_system_recht_enum" add value if not exists 'SCHULISCHE_VIDIS_ANGEBOTE_ABRUFEN' after 'ANGEBOTE_EINGESCHRAENKT_VERWALTEN';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter type "rollen_system_recht_enum" add value if not exists 'MIGRATION_DURCHFUEHREN' after 'SCHULTRAEGER_VERWALTEN';`);
  }

}
