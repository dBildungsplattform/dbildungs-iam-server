import { Migration } from '@mikro-orm/migrations';

export class Migration20241010072717 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'CRON_DURCHFUEHREN\';');
        this.addSql("update rolle set ist_technisch = true where name = 'Technischer Nutzer';");
        this.addSql(
            "update person set keycloak_user_id='7baf74aa-565f-4cfc-9d5a-8f1a3f374dc9' where referrer = 'technical';",
        );
    }
}
