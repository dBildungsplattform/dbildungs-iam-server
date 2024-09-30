import { Migration } from '@mikro-orm/migrations';

export class Migration20240930065707 extends Migration {

 async up(): Promise<void> {
    this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'IMPORT_DURCHFUEHREN\';');
  }

  override async down(): Promise<void> {

  }

}
