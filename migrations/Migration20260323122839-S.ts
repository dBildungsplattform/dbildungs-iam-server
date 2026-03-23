import { Migration } from '@mikro-orm/migrations';

export class Migration20260323122839S extends Migration {

  override async up(): Promise<void> {
    this.addSql('drop index "person_referrer_trgm_index";');

    this.addSql('create unique index "person_referrer_trgm_index_unique" on "person" using gin ("username" gin_trgm_ops);;');
  }

  override async down(): Promise<void> {
    this.addSql('drop index "person_referrer_trgm_unique_index";');

    this.addSql('create index "person_referrer_trgm_index" on "person" using gin ("username" gin_trgm_ops);;');
  }

}
