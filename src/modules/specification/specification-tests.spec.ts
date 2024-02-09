import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationsTyp } from '../organisation/domain/organisation.enums.js';
import {
    AndNotSpecification,
    AndSpecification,
    CompositeSpecification,
    NotSpecification,
    OrNotSpecification,
    OrSpecification,
} from './specifications';

class TestOrganisation {
    public name!: string;

    public typ!: OrganisationsTyp;
}

class IstSchule extends CompositeSpecification<TestOrganisation> {
    public async isSatisfiedBy(t: TestOrganisation): Promise<boolean> {
        return Promise.resolve(t.typ == OrganisationsTyp.SCHULE);
    }
}

class IstTraeger extends CompositeSpecification<TestOrganisation> {
    public async isSatisfiedBy(t: TestOrganisation): Promise<boolean> {
        return Promise.resolve(t.typ == OrganisationsTyp.SONSTIGE);
    }
}

class NameStartetMitSchule extends CompositeSpecification<TestOrganisation> {
    public async isSatisfiedBy(t: TestOrganisation): Promise<boolean> {
        return Promise.resolve(t.name.startsWith('Schule'));
    }
}

class NameStartetMitTraeger extends CompositeSpecification<TestOrganisation> {
    public async isSatisfiedBy(t: TestOrganisation): Promise<boolean> {
        return Promise.resolve(t.name.startsWith('Traeger'));
    }
}

describe('SpecificationModule', () => {
    let module: TestingModule;

    const organisation: TestOrganisation = {
        name: 'Schule1',
        typ: OrganisationsTyp.SCHULE,
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('CompositeSpecification implementation', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            expect(istSchule.isSatisfiedBy(organisation));
        });
    });

    describe('AndSpecification', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartetMitSchule: NameStartetMitSchule = new NameStartetMitSchule();
            const and: AndSpecification<TestOrganisation> = new AndSpecification(istSchule, nameStartetMitSchule);
            expect(and.isSatisfiedBy(organisation));
        });
        it('should not be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const istTraeger: IstTraeger = new IstTraeger();
            const and: AndSpecification<TestOrganisation> = new AndSpecification(istSchule, istTraeger);
            expect(!and.isSatisfiedBy(organisation));
        });
    });

    describe('OrSpecification', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const istTraeger: IstTraeger = new IstTraeger();
            const or: OrSpecification<TestOrganisation> = new OrSpecification(istSchule, istTraeger);
            expect(or.isSatisfiedBy(organisation));
        });
        it('should not be satisfied', () => {
            const istTraeger: IstTraeger = new IstTraeger();
            const nameStartetMitTraeger: NameStartetMitTraeger = new NameStartetMitTraeger();
            const or: OrSpecification<TestOrganisation> = new OrSpecification(nameStartetMitTraeger, istTraeger);
            expect(!or.isSatisfiedBy(organisation));
        });
    });

    describe('NotSpecification', () => {
        it('should be satisfied', () => {
            const istTraeger: IstTraeger = new IstTraeger();
            const istNichtTraeger: NotSpecification<TestOrganisation> = new NotSpecification<TestOrganisation>(
                istTraeger,
            );
            expect(istNichtTraeger.isSatisfiedBy(organisation));
        });
        it('should not be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const istNichtSchule: NotSpecification<TestOrganisation> = new NotSpecification<TestOrganisation>(
                istSchule,
            );
            expect(!istNichtSchule.isSatisfiedBy(organisation));
        });
    });

    describe('AndNotSpecification', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartetMitTraeger: NameStartetMitTraeger = new NameStartetMitTraeger();
            const andNot: AndNotSpecification<TestOrganisation> = new AndNotSpecification(
                istSchule,
                nameStartetMitTraeger,
            );
            expect(andNot.isSatisfiedBy(organisation));
        });
        it('should not be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartedMitSchule: NameStartetMitSchule = new NameStartetMitSchule();
            const andNot: AndNotSpecification<TestOrganisation> = new AndNotSpecification(
                istSchule,
                nameStartedMitSchule,
            );
            expect(!andNot.isSatisfiedBy(organisation));
        });
    });

    describe('OrNotSpecification', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartetMitTraeger: NameStartetMitTraeger = new NameStartetMitTraeger();
            const orNot: OrNotSpecification<TestOrganisation> = new OrNotSpecification(
                istSchule,
                nameStartetMitTraeger,
            );
            expect(orNot.isSatisfiedBy(organisation));
        });

        it('should not be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartedMitSchule: NameStartetMitSchule = new NameStartetMitSchule();
            const orNot: OrNotSpecification<TestOrganisation> = new OrNotSpecification(istSchule, nameStartedMitSchule);
            expect(!orNot.isSatisfiedBy(organisation));
        });
    });

    describe('ChainedAnd', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartetMitSchule: NameStartetMitSchule = new NameStartetMitSchule();
            expect(istSchule.and(nameStartetMitSchule).isSatisfiedBy(organisation));
        });
    });

    describe('ChainedOr', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartetMitTraeger: NameStartetMitTraeger = new NameStartetMitTraeger();
            expect(nameStartetMitTraeger.or(istSchule).isSatisfiedBy(organisation));
        });
    });

    describe('ChainedNot', () => {
        it('should be satisfied', () => {
            const istTraeger: IstTraeger = new IstTraeger();
            expect(istTraeger.not().isSatisfiedBy(organisation));
        });
    });

    describe('ChainedAndNot', () => {
        it('should be satisfied', () => {
            const istSchule: IstSchule = new IstSchule();
            const nameStartetMitTraeger: NameStartetMitTraeger = new NameStartetMitTraeger();
            expect(istSchule.andNot(nameStartetMitTraeger).isSatisfiedBy(organisation));
        });
    });

    describe('ChainedOrNot', () => {
        it('should be satisfied', () => {
            const istTraeger: IstTraeger = new IstTraeger();
            const nameStartetMitTraeger: NameStartetMitTraeger = new NameStartetMitTraeger();
            expect(nameStartetMitTraeger.orNot(istTraeger).isSatisfiedBy(organisation));
        });
    });
});
