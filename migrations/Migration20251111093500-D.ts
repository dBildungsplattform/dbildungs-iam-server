import { Migration } from '@mikro-orm/migrations';

export class Migration20250725113557 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            `UPDATE EMAIL.domain SET spsh_service_provider_id = ( SELECT ID FROM SERVICE_PROVIDER WHERE "name" = 'E-Mail');`,
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            `UPDATE EMAIL.domain SET spsh_service_provider_id = '' WHERE spsh_service_provider_id = ( SELECT ID FROM SERVICE_PROVIDER WHERE "name" = 'E-Mail');`,
        );
    }
}
