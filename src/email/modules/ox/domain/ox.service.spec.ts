import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { OxService } from './ox.service';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { ConfigTestModule, DatabaseTestModule, LoggingTestModule } from '../../../../../test/utils/index.js';
import { OxSendService } from './ox-send.service';
import { OxGroupNotFoundError } from '../error/ox-group-not-found.error';
import { OxGroupNameAmbiguousError } from '../error/ox-group-name-ambiguous.error';
import { DomainError } from '../../../../shared/error/index.js';
import { OXGroupID } from '../../../../shared/types/ox-ids.types.js';
import { OxMemberAlreadyInGroupError } from '../error/ox-member-already-in-group.error';
import { AddMemberToGroupAction } from '../actions/group/add-member-to-group.action';
import { faker } from '@faker-js/faker';
import { ChangeUserAction } from '../actions/user/change-user.action';
import { GetDataForUserAction } from '../actions/user/get-data-user.action';
import { DeleteUserAction } from '../actions/user/delete-user.action';
import { ExistsUserAction } from '../actions/user/exists-user.action';
import { ChangeByModuleAccessAction } from '../actions/user/change-by-module-access.action';
import { CreateUserAction } from '../actions/user/create-user.action';

describe('OxService', () => {
    let module: TestingModule;

    let sut: OxService;
    let loggerMock: DeepMocked<ClassLogger>;
    let oxSendService: DeepMocked<OxSendService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule, DatabaseTestModule.forRoot()],
            providers: [
                OxService,
                {
                    provide: OxSendService,
                    useValue: createMock<OxSendService>(),
                },
            ],
        }).compile();

        sut = module.get(OxService);
        oxSendService = module.get(OxSendService);
        loggerMock = module.get(ClassLogger);
        jest.useFakeTimers();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('createOxGroup', () => {
        const oxGroupName: string = faker.string.alphanumeric({ length: 6 });
        const displayName: string = faker.string.alphanumeric({ length: 6 });

        it('should return ok:true and group id if creation succeeds', async () => {
            const id: string = faker.string.uuid();
            oxSendService.send.mockResolvedValueOnce({
                ok: true,
                value: { id: id },
            });

            const result: Result<OXGroupID, Error> = await sut.createOxGroup(oxGroupName, displayName);
            expect(result).toEqual({ ok: true, value: id });
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.stringContaining(`Successfully Created OxGroup, oxGroupId:${id}`),
            );
        });

        it('should log error and return result if creation fails', async () => {
            const error: OxGroupNameAmbiguousError = new OxGroupNameAmbiguousError('');
            oxSendService.send.mockResolvedValueOnce({
                ok: false,
                error,
            });

            const result: Result<OXGroupID, Error> = await sut.createOxGroup(oxGroupName, displayName);
            expect(result).toEqual({ ok: false, error });
            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining(
                    `Could Not Create OxGroup with name:${oxGroupName}, displayName:${displayName}`,
                ),
            );
        });
    });

    describe('addOxUserToGroup', () => {
        const oxUserId: string = faker.string.alphanumeric({ length: 6 });
        const schuleDstrNr: string = faker.string.alphanumeric({ length: 6 });
        const oxGroupId: string = faker.string.alphanumeric({ length: 6 });

        it('should log error if group lookup fails', async () => {
            jest.spyOn(sut, 'getExistingOxGroupByNameOrCreateOxGroup').mockResolvedValueOnce({
                ok: false,
                error: new Error('fail'),
            });

            await sut.addOxUserToGroup(oxUserId, schuleDstrNr);

            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining(`Could not get OxGroup for schulenDstNr:${schuleDstrNr}`),
            );
        });

        it('should log error if adding member fails with non-OxMemberAlreadyInGroupError', async () => {
            jest.spyOn(sut, 'getExistingOxGroupByNameOrCreateOxGroup').mockResolvedValueOnce({
                ok: true,
                value: oxGroupId,
            });
            jest.spyOn(sut, 'createAddMemberToGroupAction').mockReturnValue({} as AddMemberToGroupAction);
            oxSendService.send.mockResolvedValueOnce({ ok: false, error: new OxGroupNotFoundError('') });

            await sut.addOxUserToGroup(oxUserId, schuleDstrNr);

            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining(`Could not add oxUser to oxGroup, schulenDstNr:${schuleDstrNr}`),
            );
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    `Successfully added oxUser to oxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                ),
            );
        });

        it('should not log error if adding member fails with OxMemberAlreadyInGroupError', async () => {
            jest.spyOn(sut, 'getExistingOxGroupByNameOrCreateOxGroup').mockResolvedValueOnce({
                ok: true,
                value: oxGroupId,
            });
            jest.spyOn(sut, 'createAddMemberToGroupAction').mockReturnValue({} as AddMemberToGroupAction);
            oxSendService.send.mockResolvedValueOnce({
                ok: false,
                error: new OxMemberAlreadyInGroupError('already in group'),
            });

            await sut.addOxUserToGroup(oxUserId, schuleDstrNr);

            expect(loggerMock.error).not.toHaveBeenCalledWith(
                expect.stringContaining(`Could not add oxUser to oxGroup, schulenDstNr:${schuleDstrNr}`),
            );
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    `Successfully added oxUser to oxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                ),
            );
        });

        it('should add user to group and log info on success', async () => {
            jest.spyOn(sut, 'getExistingOxGroupByNameOrCreateOxGroup').mockResolvedValueOnce({
                ok: true,
                value: oxGroupId,
            });
            jest.spyOn(sut, 'createAddMemberToGroupAction').mockReturnValue({} as AddMemberToGroupAction);
            oxSendService.send.mockResolvedValueOnce({ ok: true, value: {} });

            await sut.addOxUserToGroup(oxUserId, schuleDstrNr);

            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    `Successfully added oxUser to oxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                ),
            );
        });
    });

    describe('getExistingOxGroupByNameOrCreateOxGroup', () => {
        const oxGroupName: string = faker.string.alphanumeric({ length: 6 });
        const displayName: string = faker.string.alphanumeric({ length: 6 });

        it('should return ok:true if group exists', async () => {
            jest.spyOn(sut, 'getOxGroupByName').mockResolvedValueOnce('groupId');

            const result: Result<OXGroupID, Error> = await sut.getExistingOxGroupByNameOrCreateOxGroup(
                oxGroupName,
                displayName,
            );
            expect(result).toEqual({ ok: true, value: 'groupId' });
        });

        it('should create group if not found', async () => {
            jest.spyOn(sut, 'getOxGroupByName').mockResolvedValueOnce(new OxGroupNotFoundError(oxGroupName));
            jest.spyOn(sut, 'createOxGroup').mockResolvedValueOnce({ ok: true, value: 'newGroupId' });

            const result: Result<OXGroupID, Error> = await sut.getExistingOxGroupByNameOrCreateOxGroup(
                oxGroupName,
                displayName,
            );
            expect(result).toEqual({ ok: true, value: 'newGroupId' });
        });

        it('should return error if getOxGroupByName returns DomainError (not NotFound)', async () => {
            const error: OxGroupNameAmbiguousError = new OxGroupNameAmbiguousError(oxGroupName);
            jest.spyOn(sut, 'getOxGroupByName').mockResolvedValueOnce(error);

            const result: Result<OXGroupID, Error> = await sut.getExistingOxGroupByNameOrCreateOxGroup(
                oxGroupName,
                displayName,
            );
            expect(result).toEqual({ ok: false, error });
        });
    });

    describe('getOxGroupByName', () => {
        const oxGroupName: string = faker.string.alphanumeric({ length: 6 });

        it('should return group id if exactly one group is found', async () => {
            const groupId: string = faker.string.uuid();
            oxSendService.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    groups: [
                        {
                            id: groupId,
                            displayname: faker.string.alphanumeric({ length: 6 }),
                            name: oxGroupName,
                            memberIds: [],
                        },
                    ],
                },
            });

            const result: DomainError | OXGroupID = await sut.getOxGroupByName(oxGroupName);
            expect(result).toBe(groupId);
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.stringContaining('Found existing oxGroup for oxGroupName:' + oxGroupName),
            );
        });

        it('should return OxGroupNotFoundError if no groups found', async () => {
            oxSendService.send.mockResolvedValueOnce({
                ok: true,
                value: { groups: [] },
            });

            const result: DomainError | OXGroupID = await sut.getOxGroupByName(oxGroupName);
            expect(result).toBeInstanceOf(OxGroupNotFoundError);
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.stringContaining('Found No Matching OxGroup For OxGroupName:' + oxGroupName),
            );
        });

        it('should return OxGroupNameAmbiguousError if multiple groups found', async () => {
            oxSendService.send.mockResolvedValueOnce({
                ok: true,
                value: {
                    groups: [
                        {
                            id: faker.string.uuid(),
                            displayname: faker.string.alphanumeric({ length: 6 }),
                            name: oxGroupName,
                            memberIds: [],
                        },
                        {
                            id: faker.string.uuid(),
                            displayname: faker.string.alphanumeric({ length: 6 }),
                            name: oxGroupName,
                            memberIds: [],
                        },
                    ],
                },
            });

            const result: DomainError | OXGroupID = await sut.getOxGroupByName(oxGroupName);
            expect(result).toBeInstanceOf(OxGroupNameAmbiguousError);
            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining('Found multiple OX-groups For OxGroupName:' + oxGroupName),
            );
        });

        it('should return error if oxSendService.send fails', async () => {
            const error: OxGroupNotFoundError = new OxGroupNotFoundError('');
            oxSendService.send.mockResolvedValueOnce({ ok: false, error });

            const result: DomainError | OXGroupID = await sut.getOxGroupByName(oxGroupName);
            expect(result).toBe(error);
            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining('Could Not Retrieve Groups For Context'),
            );
        });
    });

    describe('OxService action creators', () => {
        it('createChangeUserAction returns ChangeUserAction', () => {
            const action: ChangeUserAction = sut.createChangeUserAction(
                faker.string.uuid(),
                faker.internet.userName(),
                [faker.internet.email()],
                faker.person.firstName(),
                faker.person.lastName(),
                faker.person.fullName(),
                faker.internet.email(),
                faker.internet.email(),
            );
            expect(action).toBeInstanceOf(ChangeUserAction);
        });

        it('createGetDataForUserAction returns GetDataForUserAction', () => {
            const action: GetDataForUserAction = sut.createGetDataForUserAction(faker.string.uuid());
            expect(action).toBeInstanceOf(GetDataForUserAction);
        });

        it('createDeleteUserAction returns DeleteUserAction', () => {
            const action: DeleteUserAction = sut.createDeleteUserAction(faker.string.uuid());
            expect(action).toBeInstanceOf(DeleteUserAction);
        });

        it('createAddMemberToGroupAction returns AddMemberToGroupAction', () => {
            const action: AddMemberToGroupAction = sut.createAddMemberToGroupAction(
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(action).toBeInstanceOf(AddMemberToGroupAction);
        });

        it('createExistsUserAction returns ExistsUserAction', () => {
            const action: ExistsUserAction = sut.createExistsUserAction(faker.internet.userName());
            expect(action).toBeInstanceOf(ExistsUserAction);
        });

        it('createCreateUserAction returns CreateUserAction', () => {
            const action: CreateUserAction = sut.createCreateUserAction({
                displayName: faker.person.fullName(),
                username: faker.internet.userName(),
                firstname: faker.person.firstName(),
                lastname: faker.person.lastName(),
                primaryEmail: faker.internet.email(),
            });
            expect(action).toBeInstanceOf(CreateUserAction);
        });

        it('createChangeByModuleAccessAction returns ChangeByModuleAccessAction', () => {
            const action: ChangeByModuleAccessAction = sut.createChangeByModuleAccessAction(faker.string.uuid());
            expect(action).toBeInstanceOf(ChangeByModuleAccessAction);
        });
    });
});
