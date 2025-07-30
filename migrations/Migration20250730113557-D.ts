import { Migration } from '@mikro-orm/migrations';

export class Migration20250725113557 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            "insert into service_provider_merkmal select id, 'NACHTRAEGLICH_ZUWEISBAR' from service_provider where name != 'E-Mail'",
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            "delete from service_provider_merkmal where service_provider_id in (select id from service_provider where name != 'E-Mail');",
        );
    }
}
