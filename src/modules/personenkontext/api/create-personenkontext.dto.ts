import { AutoMap } from '@automapper/classes';
import { Rolle, Personenstatus, Jahrgangsstufe } from '../domain/personenkontext.enums.js';

export class CreatePersonenkontextDto {
    @AutoMap()
    public personId!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap()
    public readonly rolle!: Rolle;

    @AutoMap()
    public readonly personenstatus?: Personenstatus;

    @AutoMap()
    public readonly jahrgangsstufe?: Jahrgangsstufe;
}
