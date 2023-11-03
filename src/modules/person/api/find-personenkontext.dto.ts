import { AutoMap } from '@automapper/classes';
import { Rolle, Personenstatus } from '../domain/personenkontext.enums.js';
import { SichtfreigabeType } from './personen-query.param.js';

export class FindPersonenkontextDto {
    @AutoMap()
    public personId!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap(() => String)
    public readonly rolle?: Rolle;

    @AutoMap(() => String)
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;
}
