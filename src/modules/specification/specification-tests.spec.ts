import {Test, TestingModule} from "@nestjs/testing";
import {OrganisationsTyp} from "../organisation/domain/organisation.enums.js";
import {CompositeSpecification} from "./composite-specification.js";
import {SpecificationModule} from "./specification.module";

class TestOrganisation {
    public name!: string;
    public typ!: OrganisationsTyp;
}

class IstSchule extends CompositeSpecification<TestOrganisation> {
    public async isSatisfiedBy(t: TestOrganisation): Promise<boolean> {
        return Promise.resolve(t.typ == OrganisationsTyp.SCHULE);
    }
}

describe('SpecificationModule', () => {
    let module: TestingModule;

    const organisation: TestOrganisation = {
        name: 'Schule1',
        typ: OrganisationsTyp.SCHULE
    }

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [SpecificationModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('CompositeSpecification implementation', () => {
        const istSchule = new IstSchule();
        expect(istSchule.isSatisfiedBy(organisation));

    });

})
