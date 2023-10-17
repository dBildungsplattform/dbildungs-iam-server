import { AutoMap } from '@automapper/classes';
import { SichtfreigabeType } from './personen-query.param.js';

export class FindPersonendatensatzDto {
    @AutoMap()
    public referrer?: string;

    @AutoMap()
    public familienname?: string;

    @AutoMap()
    public vorname?: string;

    @AutoMap()
    public sichtfreigabe!: SichtfreigabeType;
}
