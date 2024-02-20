import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { Referenzgruppen } from '../persistence/referenzgruppen.js';
import {
    Bildungsziele,
    Faecherkanon,
    Gruppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from './gruppe.enums.js';

export class Gruppe {
    private referrer: string;

    private bezeichnung: string;

    private thema: string;

    private beschreibung: string;

    private typ: GruppenTyp;

    private bereich: Gruppenbereich;

    private optionen: Gruppenoption[];

    private differenzierung: Gruppendifferenzierung;

    private bildungsziele?: Bildungsziele[];

    private jahrgangsstufen?: Jahrgangsstufe[];

    private faecher?: Faecherkanon[];

    private referenzgruppen: Referenzgruppen[];

    // private laufzeit: Laufzeit;

    public getReferrer(): string {
        return this.referrer;
    }

    public getBezeichnung(): string {
        return this.bezeichnung;
    }

    public getThema(): string {
        return this.thema;
    }

    public getBeschreibung(): string {
        return this.beschreibung;
    }

    public getTyp(): GruppenTyp {
        return this.typ;
    }

    public getBereich(): Gruppenbereich {
        return this.bereich;
    }

    public getOptionen(): Gruppenoption[] {
        return this.optionen;
    }

    public getDifferenzierung(): Gruppendifferenzierung {
        return this.differenzierung;
    }

    public getBildungsziele(): Bildungsziele[] {
        return this.bildungsziele ?? [];
    }

    public getJahrgangsstufen(): Jahrgangsstufe[] {
        return this.jahrgangsstufen ?? [];
    }

    public getFaecher(): Faecherkanon[] {
        return this.faecher ?? [];
    }

    public getReferenzgruppen(): Referenzgruppen[] {
        return this.referenzgruppen;
    }

    // public getLaufzeit(): Laufzeit {
    //     return this.laufzeit;
    // }

    private constructor(createGroupBodyParams: CreateGroupBodyParams) {
        this.referrer = createGroupBodyParams.referrer ?? '';
        this.bezeichnung = createGroupBodyParams.bezeichnung ?? '';
        this.thema = createGroupBodyParams.thema ?? '';
        this.beschreibung = createGroupBodyParams.beschreibung ?? '';
        this.typ = createGroupBodyParams.typ ?? GruppenTyp.SONSTIG;
        this.bereich = createGroupBodyParams.bereich ?? Gruppenbereich.PFLICHT;
        this.optionen = createGroupBodyParams.optionen ?? [];
        this.differenzierung = createGroupBodyParams.differenzierung ?? Gruppendifferenzierung.E;
        this.bildungsziele = createGroupBodyParams.bildungsziele;
        this.jahrgangsstufen = createGroupBodyParams.jahrganagsstufen;
        this.faecher = createGroupBodyParams.faecher;
        this.referenzgruppen = createGroupBodyParams.referenzgruppen;
        // this.laufzeit = createGroupBodyParams.laufzeit;
    }

    public static createGroup(createGroupBodyParams: CreateGroupBodyParams): Gruppe {
        return new Gruppe(createGroupBodyParams);
    }
}
