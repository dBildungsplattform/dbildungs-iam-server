import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderZugriffDoRolleRechtEntityConverter } from './service-provider-zugriff-do-rolle-recht-entity.converter.js';
import { ServiceProviderZugriffDo } from '../domain/service-provider-zugriff.do.js';
import { DoFactory } from '../../../../test/utils/index.js';
import { ServiceProviderZugriffEntity } from '../entity/service-provider-zugriff.entity.js';
import { RolleRechtDo } from '../domain/rolle-recht.do.js';
import { RolleRechtEntity } from '../entity/rolle-recht.entity.js';

describe('ServiceProviderZugriffDoRolleRechtEntityConverter', () => {
    let module: TestingModule;
    let serviceProviderZugriffDoRolleRechtEntityConverter: ServiceProviderZugriffDoRolleRechtEntityConverter;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [ServiceProviderZugriffDoRolleRechtEntityConverter],
        }).compile();
        serviceProviderZugriffDoRolleRechtEntityConverter = module.get(
            ServiceProviderZugriffDoRolleRechtEntityConverter,
        );
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(serviceProviderZugriffDoRolleRechtEntityConverter).toBeDefined();
    });

    describe('test converting ServiceProviderZugriffDo to RolleRechtEntity', () => {
        describe('when ServiceProviderZugriffDo is passed as parameter', () => {
            it('should return result and result should be a ServiceProviderZugriffEntity', () => {
                const spzDo: ServiceProviderZugriffDo<false> = DoFactory.createServiceProviderZugriff(false);
                const rolleRechtEntity: RolleRechtEntity =
                    serviceProviderZugriffDoRolleRechtEntityConverter.convert(spzDo);
                expect(rolleRechtEntity).toBeTruthy();
                expect(rolleRechtEntity instanceof ServiceProviderZugriffEntity).toBeTruthy();
                expect(
                    (rolleRechtEntity as unknown as ServiceProviderZugriffDo<boolean>).serviceProvider,
                ).toStrictEqual(spzDo.serviceProvider);
            });
        });
        describe('when NOT a ServiceProviderZugriffDo is passed as parameter', () => {
            it('should return result as RolleRechtEntity only, not an instance of ServiceProviderZugriffEntity', () => {
                const rolleRechtDo: RolleRechtDo<false> = DoFactory.createRolleRecht(false);
                const rolleRechtEntity: RolleRechtEntity =
                    serviceProviderZugriffDoRolleRechtEntityConverter.convert(rolleRechtDo);
                expect(rolleRechtEntity).toBeTruthy();
                expect(rolleRechtEntity instanceof ServiceProviderZugriffEntity).toBeFalsy();
            });
        });
    });
});
