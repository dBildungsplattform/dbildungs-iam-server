import { Migration } from '@mikro-orm/migrations';

export class Migration20250218094804 extends Migration {

  public async up(): Promise<void> {
    this.addSql('create type "meldung_status_enum" as enum (\'VEROEFFENTLICHT\', \'NICHT_VEROEFFENTLICHT\');');
    this.addSql('alter table "meldung" alter column "status" drop default;');
    this.addSql('alter table "meldung" drop constraint if exists "meldung_status_check";');

    this.addSql('alter table "meldung" alter column "status" type "meldung_status_enum" using ("status"::"meldung_status_enum");');

    this.addSql('alter table "meldung" alter column "status" set default \'NICHT_VEROEFFENTLICHT\';');
  }

  public override async down(): Promise<void> {
    this.addSql('alter table "meldung" alter column "status" drop default;');

    this.addSql('alter table "meldung" alter column "status" type text using ("status"::text);');
    this.addSql('alter table "meldung" add constraint "meldung_status_check" check("status" in (\'veroeffentlicht\', \'nicht_veroeffentlicht\'));');

    this.addSql('alter table "meldung" alter column "status" set default \'nicht_veroeffentlicht\';');

    this.addSql('drop type "meldung_status_enum";');
  }

}
