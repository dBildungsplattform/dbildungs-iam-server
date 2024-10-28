import { Migration } from '@mikro-orm/migrations';

export class Migration20241028162253 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "organisation" add column "version" bigint not null default 1;');

    this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'CRON_DURCHFUEHREN\';');
  }

  override async down(): Promise<void> {
    this.addSql('alter table "organisation" drop column "version";');
  }

}
