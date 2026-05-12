import { Migration } from '@mikro-orm/migrations';

export class Migration20260420061425 extends Migration {
    async up(): Promise<void> {
        this.addSql('create index "rolle_service_provider_rolle_id_index" on "rolle_service_provider" ("rolle_id");');
        this.addSql(
            'create index "rolle_service_provider_service_provider_id_index" on "rolle_service_provider" ("service_provider_id");',
        );
        this.addSql('create index "rolle_name_index" on "rolle" ("name");');
    }

    override async down(): Promise<void> {
        this.addSql('drop index "rolle_service_provider_rolle_id_index";');
        this.addSql('drop index "rolle_service_provider_service_provider_id_index";');
        this.addSql('drop index "rolle_name_index";');
    }
}
