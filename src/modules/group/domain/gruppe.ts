import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import {
    Bildungsziele,
    Faecherkanon,
    Gruppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
    Gruppenrollen,
} from './gruppe.enums.js';
import { Laufzeit } from '../persistence/laufzeit.entity.js';
import { ReferenzgruppeParam } from '../api/referenzgruppe.params.js';

export class Gruppe<WasPersisted extends boolean> {
    public readonly mandant: string = '';

    public readonly organisationId: string = '';

    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public bezeichnung: string,
        public typ: GruppenTyp,
        public revision: string,
        public referrer?: string,
        public thema?: string,
        public beschreibung?: string,
        public bereich?: Gruppenbereich,
        public optionen?: Gruppenoption[],
        public differenzierung?: Gruppendifferenzierung,
        public bildungsziele?: Bildungsziele[],
        public jahrgangsstufen?: Jahrgangsstufe[],
        public faecher?: Faecherkanon[],
        public referenzgruppenIds?: string[],
        public referenzgruppenRollen?: Gruppenrollen[][],
        public laufzeit?: Laufzeit,
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.bezeichnung = bezeichnung;
        this.typ = typ;
        this.revision = revision;
        this.referrer = referrer;
        this.thema = thema;
        this.beschreibung = beschreibung;
        this.bereich = bereich;
        this.optionen = optionen;
        this.differenzierung = differenzierung;
        this.bildungsziele = bildungsziele;
        this.jahrgangsstufen = jahrgangsstufen;
        this.faecher = faecher;
        this.referenzgruppenIds = referenzgruppenIds;
        this.referenzgruppenRollen = referenzgruppenRollen;
        this.laufzeit = laufzeit ?? new Laufzeit({});
    }

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        bezeichnung: string,
        typ: GruppenTyp,
        revision: string,
        referrer?: string,
        thema?: string,
        beschreibung?: string,
        bereich?: Gruppenbereich,
        optionen?: Gruppenoption[],
        differenzierung?: Gruppendifferenzierung,
        bildungsziele?: Bildungsziele[],
        jahrgangsstufen?: Jahrgangsstufe[],
        faecher?: Faecherkanon[],
        referenzgruppen?: string[],
        referenzgruppenRollen?: Gruppenrollen[][],
        laufzeit?: Laufzeit,
    ): Gruppe<WasPersisted> {
        return new Gruppe(
            id,
            createdAt,
            updatedAt,
            bezeichnung,
            typ,
            revision,
            referrer,
            thema,
            beschreibung,
            bereich,
            optionen,
            differenzierung,
            bildungsziele,
            jahrgangsstufen,
            faecher,
            referenzgruppen,
            referenzgruppenRollen,
            laufzeit,
        );
    }

    public static createGroup(createGroupBodyParams: CreateGroupBodyParams): Gruppe<false> {
        return new Gruppe(
            undefined,
            undefined,
            undefined,
            createGroupBodyParams.bezeichnung,
            createGroupBodyParams.typ,
            '',
            createGroupBodyParams.referrer,
            createGroupBodyParams.thema,
            createGroupBodyParams.beschreibung,
            createGroupBodyParams.bereich,
            createGroupBodyParams.optionen,
            createGroupBodyParams.differenzierung,
            createGroupBodyParams.bildungsziele,
            createGroupBodyParams.jahrgangsstufen,
            createGroupBodyParams.faecher,
            createGroupBodyParams.referenzgruppen?.map(
                (referenzgruppe: ReferenzgruppeParam) => referenzgruppe.referenzgruppenId,
            ),
            createGroupBodyParams.referenzgruppen?.map((referenzgruppe: ReferenzgruppeParam) => referenzgruppe.rollen),
            createGroupBodyParams.laufzeit,
        );
    }
}
