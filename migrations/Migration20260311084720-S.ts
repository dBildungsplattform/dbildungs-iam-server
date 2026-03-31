import { Migration } from '@mikro-orm/migrations';

export class Migration20260311084720 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'ANGEBOTE_EINGESCHRAENKT_VERWALTEN\';');
  }

}
