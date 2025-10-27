import { Migration } from '@mikro-orm/migrations';

export class Migration20251027105102 extends Migration {

  async up(): Promise<void> {
    this.addSql(`alter table "email"."domain" add column "spsh_service_provider_id" varchar(255) not null default '';`);
  }

  override async down(): Promise<void> {
    this.addSql('alter table "email"."domain" drop column "spsh_service_provider_id";');
  }

}
