import { Migration } from '@mikro-orm/migrations';

export class Migration20240917134618 extends Migration {
    public override up(): void {
        this.addSql("create type \"service_provider_system_enum\" as enum ('NONE', 'EMAIL', 'ITSLEARNING');");

        // Add new column without null constraint
        this.addSql('alter table "service_provider" add column "system" "service_provider_system_enum";');

        // Set values
        this.addSql("update service_provider set system = 'NONE';");
        this.addSql("update service_provider set system = 'ITSLEARNING' where name = 'itslearning';");
        this.addSql("update service_provider set system = 'EMAIL' where name = 'E-Mail';");

        // Add null constraint
        this.addSql('alter table "service_provider" alter column "system" set not null;');
    }

    public override down(): void {
        this.addSql('alter table "service_provider" drop column "system";');

        this.addSql('drop type "service_provider_system_enum";');
    }
}
