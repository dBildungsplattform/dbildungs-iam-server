import { Injectable } from '@nestjs/common';
import { GruppeEntity } from '../persistence/gruppe.entity.js';
import { Gruppe } from './gruppe.js';
import { GruppenDo } from './gruppe.do.js';
@Injectable()
export class GruppeMapper {
    public mapGruppeToGruppeEntity(gruppe: Gruppe): GruppeEntity {
        const gruppeEntity: GruppeEntity = new GruppeEntity();
        gruppeEntity.mandant = '';
        gruppeEntity.organisationId = '';
        gruppeEntity.referrer = gruppe.getReferrer();
        gruppeEntity.bezeichnung = gruppe.getBezeichnung();
        gruppeEntity.thema = gruppe.getThema();
        gruppeEntity.beschreibung = gruppe.getBeschreibung();
        gruppeEntity.typ = gruppe.getTyp();
        gruppeEntity.bereich = gruppe.getBereich();
        gruppeEntity.optionen = gruppe.getOptionen();
        gruppeEntity.differenzierung = gruppe.getDifferenzierung();
        gruppeEntity.bildungsziele = gruppe.getBildungsziele();
        gruppeEntity.jahrgangsstufen = gruppe.getJahrgangsstufen();
        gruppeEntity.faecher = gruppe.getFaecher();
        gruppeEntity.referenzgruppen = gruppe.getReferenzgruppen();
        gruppeEntity.laufzeit = gruppe.getLaufzeit();
        return gruppeEntity;
    }

    public mapGruppeEntityToGruppe(entity: GruppeEntity): Gruppe {
        return Gruppe.construct(
            entity.bezeichnung,
            entity.typ,
            entity.referrer,
            entity.thema,
            entity.beschreibung,
            entity.bereich,
            entity.optionen,
            entity.differenzierung,
            entity.bildungsziele,
            entity.jahrgangsstufen,
            entity.faecher,
            entity.referenzgruppen,
            entity.laufzeit,
        );
    }

    public mapGruppeEntityToGruppnDo(entity: GruppeEntity): GruppenDo<true> {
        const gruppeDo: GruppenDo<true> = new GruppenDo();
        gruppeDo.id = entity.id;
        gruppeDo.createdAt = entity.createdAt;
        gruppeDo.updatedAt = entity.updatedAt;
        gruppeDo.mandant = entity.mandant;
        gruppeDo.organisationId = entity.organisationId;
        gruppeDo.referrer = entity.referrer;
        gruppeDo.bezeichnung = entity.bezeichnung;
        gruppeDo.thema = entity.thema;
        gruppeDo.beschreibung = entity.beschreibung;
        gruppeDo.typ = entity.typ;
        gruppeDo.bereich = entity.bereich;
        gruppeDo.optionen = entity.optionen;
        gruppeDo.differenzierung = entity.differenzierung;
        gruppeDo.bildungsziele = entity.bildungsziele;
        gruppeDo.jahrgangsstufen = entity.jahrgangsstufen;
        gruppeDo.faecher = entity.faecher;
        gruppeDo.referenzgruppen = entity.referenzgruppen;
        gruppeDo.laufzeit = entity.laufzeit;
        return gruppeDo;
    }
}
