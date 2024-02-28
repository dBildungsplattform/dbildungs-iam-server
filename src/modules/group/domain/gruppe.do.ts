import { DoBase } from '../../../shared/types/index.js';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { Laufzeit } from '../persistence/laufzeit.js';
import {
    GruppenTyp,
    Gruppenbereich,
    Gruppenoption,
    Gruppendifferenzierung,
    Bildungsziele,
    Faecherkanon,
} from './gruppe.enums.js';
import { Referenzgruppen } from './referenzgruppen.js';

export class GruppenDo<WasPersisted extends boolean> implements DoBase<WasPersisted> {

    public id!: Persisted<string, WasPersisted>;

    public createdAt!: Persisted<Date, WasPersisted>;

    public updatedAt!: Persisted<Date, WasPersisted>;

    public mandant!: string;

    public organisationId?: string;

    public bezeichnung?: string;

    public referrer?: string;

    public typ?: GruppenTyp;

    public thema?: string;

    public beschreibung?: string;

    public bereich?: Gruppenbereich;

    public optionen?: Gruppenoption[];

    public differenzierung?: Gruppendifferenzierung;

    public bildungsziele?: Bildungsziele[];

    public jahrgangsstufen?: Jahrgangsstufe[];

    public faecher?: Faecherkanon[];

    public referenzgruppen?: Referenzgruppen[];

    public laufzeit?: Laufzeit;
}
