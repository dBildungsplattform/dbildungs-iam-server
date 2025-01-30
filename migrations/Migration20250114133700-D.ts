import { Migration } from '@mikro-orm/migrations';

export class Migration20250114120248 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'update person as p set ist_technisch = true where p.id in (select pk.person_id from personenkontext as pk join rolle as r on r.id = pk.rolle_id where r.ist_technisch = true);',
        );
    }
}
