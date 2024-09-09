import { Migration } from '@mikro-orm/migrations';

export class Migration20240909061707 extends Migration {

  public up(): void {
    this.addSql('create type "email_address_status_enum" as enum (\'ENABLED\', \'DISABLED\', \'REQUESTED\');');
    this.addSql('alter table "email_address" drop column "enabled";');

    this.addSql('alter table "email_address" add column "status" "email_address_status_enum" not null;');
  }

  public override down(): void {
    this.addSql('alter table "email_address" drop column "status";');

    this.addSql('alter table "email_address" add column "enabled" boolean not null;');

    this.addSql('drop type "email_address_status_enum";');
  }

}
