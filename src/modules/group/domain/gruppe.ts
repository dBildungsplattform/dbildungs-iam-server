import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { CreateGroupBodyParams } from '../api/create-group.body.params.js';
import { Referenzgruppen } from './referenzgruppen.js';
import {
    Bildungsziele,
    Faecherkanon,
    Gruppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from './gruppe.enums.js';
import { Laufzeit } from '../persistence/laufzeit.js';
export class Gruppe<WasPersisted extends boolean> {
    public static readonly CREATE_GROUP_MANDANT_UUID: string = '00000000-0000-0000-0000-000000000000';

    public static readonly CREATE_GROUP_ORGANISATION_UUID: string = '00000000-0000-0000-0000-000000000000';

    private readonly id?: Persisted<string, WasPersisted>;

    private readonly mandant: Persisted<string, WasPersisted> = Gruppe.CREATE_GROUP_MANDANT_UUID;

    private readonly organisationId: Persisted<string, WasPersisted> = Gruppe.CREATE_GROUP_ORGANISATION_UUID;

    private referrer?: string;

    private bezeichnung!: string;

    private thema?: string;

    private beschreibung?: string;

    private typ!: GruppenTyp;

    private bereich?: Gruppenbereich;

    private optionen?: Gruppenoption[];

    private differenzierung?: Gruppendifferenzierung;

    private bildungsziele?: Bildungsziele[];

    private jahrgangsstufen?: Jahrgangsstufe[];

    private faecher?: Faecherkanon[];

    private referenzgruppen?: Referenzgruppen[];

    private laufzeit?: Laufzeit;

    public getId(): string {
        return this.id ?? '';
    }

    public getMandant(): string {
        return this.mandant ?? '';
    }

    public getOrganisationId(): string {
        return this.organisationId ?? '';
    }

    public getReferrer(): string {
        return this.referrer ?? '';
    }

    public getBezeichnung(): string {
        return this.bezeichnung;
    }

    public getThema(): string {
        return this.thema ?? '';
    }

    public getBeschreibung(): string {
        return this.beschreibung ?? '';
    }

    public getTyp(): GruppenTyp {
        return this.typ;
    }

    public getBereich(): Gruppenbereich | undefined {
        return this.bereich;
    }

    public getOptionen(): Gruppenoption[] {
        return this.optionen ?? [];
    }

    public getDifferenzierung(): Gruppendifferenzierung | undefined {
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
        return this.referenzgruppen ?? [];
    }

    public getLaufzeit(): Laufzeit | undefined {
        return this.laufzeit ?? undefined;
    }

    private constructor(
        id: Persisted<string, WasPersisted>,
        mandant: Persisted<string, WasPersisted>,
        organisationId: Persisted<string, WasPersisted>,
        bezeichnung: string,
        typ: GruppenTyp,
        referrer?: string,
        thema?: string,
        beschreibung?: string,
        bereich?: Gruppenbereich,
        optionen?: Gruppenoption[],
        differenzierung?: Gruppendifferenzierung,
        bildungsziele?: Bildungsziele[],
        jahrgangsstufen?: Jahrgangsstufe[],
        faecher?: Faecherkanon[],
        referenzgruppen?: Referenzgruppen[],
        laufzeit?: Laufzeit,
    ) {
        this.id = id;
        this.mandant = mandant;
        this.organisationId = organisationId;
        this.bezeichnung = bezeichnung ?? '';
        this.typ = typ ?? GruppenTyp.SONSTIG;
        this.referrer = referrer;
        this.thema = thema;
        this.beschreibung = beschreibung;
        this.bereich = bereich;
        this.optionen = optionen;
        this.differenzierung = differenzierung;
        this.bildungsziele = bildungsziele;
        this.jahrgangsstufen = jahrgangsstufen;
        this.faecher = faecher;
        this.referenzgruppen = referenzgruppen;
        this.laufzeit = laufzeit;
    }

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        mandant: string,
        organisationId: string,
        bezeichnung: string,
        typ: GruppenTyp,
        referrer?: string,
        thema?: string,
        beschreibung?: string,
        bereich?: Gruppenbereich,
        optionen?: Gruppenoption[],
        differenzierung?: Gruppendifferenzierung,
        bildungsziele?: Bildungsziele[],
        jahrgangsstufen?: Jahrgangsstufe[],
        faecher?: Faecherkanon[],
        referenzgruppen?: Referenzgruppen[],
        laufzeit?: Laufzeit,
    ): Gruppe<WasPersisted> {
        return new Gruppe(
            id,
            mandant,
            organisationId,
            bezeichnung,
            typ,
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
            createGroupBodyParams.referrer,
            createGroupBodyParams.thema,
            createGroupBodyParams.beschreibung,
            createGroupBodyParams.bereich,
            createGroupBodyParams.optionen,
            createGroupBodyParams.differenzierung,
            createGroupBodyParams.bildungsziele,
            createGroupBodyParams.jahrgangsstufen,
            createGroupBodyParams.faecher,
            createGroupBodyParams.referenzgruppen,
            createGroupBodyParams.laufzeit,
        );
    }
}
