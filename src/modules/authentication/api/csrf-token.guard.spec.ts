import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { createExecutionContextMock, createRequestMock } from '../../../../test/utils/http.mocks.js';
import { CsrfTokenService } from '../services/csrf-token.service.js';
import { CsrfProtectionGuard } from './csrf-token.guard.js';

describe('The CSRF protection guard', () => {
    let csrfTokenService: DeepMocked<CsrfTokenService>;
    let sut: CsrfProtectionGuard;

    beforeEach(() => {
        csrfTokenService = createMock(CsrfTokenService);
        sut = new CsrfProtectionGuard(csrfTokenService);
    });

    it('should allow GET requests', () => {
        const request = createRequestMock({
            method: 'GET',
            path: '/api/something',
        });

        const context: ExecutionContext = createExecutionContextMock({ request });

        expect(sut.canActivate(context)).toEqual(true);
    });

    it('should allow HEAD/OPTIONS requests', () => {
        const headRequest = createRequestMock({ method: 'HEAD' });
        const optionsRequest = createRequestMock({ method: 'OPTIONS' });

        expect(sut.canActivate(createExecutionContextMock({ request: headRequest }))).toEqual(true);
        expect(sut.canActivate(createExecutionContextMock({ request: optionsRequest }))).toEqual(true);
    });

    it('should allow JWT requests (Bearer token)', () => {
        const request = createRequestMock({
            method: 'POST',
            headers: {
                authorization: 'Bearer some-token',
            },
        });

        const context = createExecutionContextMock({ request });

        expect(sut.canActivate(context)).toEqual(true);
    });

    it('should allow public routes', () => {
        const request = createRequestMock({
            method: 'POST',
            path: '/api/health',
        });

        const context: ExecutionContext = createExecutionContextMock({ request });

        expect(sut.canActivate(context)).toEqual(true);
    });

    it('should allow other public route prefixes', () => {
        const request = createRequestMock({
            method: 'POST',
            path: '/api/docs/something-deep',
        });

        const context = createExecutionContextMock({ request });

        expect(sut.canActivate(context)).toEqual(true);
    });

    it('should throw BadRequestException when CSRF token is invalid', () => {
        csrfTokenService.validateToken.mockReturnValue(false);

        const request = createRequestMock({
            method: 'POST',
            path: '/api/protected',
            headers: {},
        });

        const context = createExecutionContextMock({ request });

        expect(() => sut.canActivate(context)).toThrow(BadRequestException);
        expect(csrfTokenService.validateToken).toHaveBeenCalledWith(request);
    });

    it('should allow request when CSRF token is valid', () => {
        csrfTokenService.validateToken.mockReturnValue(true);

        const request = createRequestMock({
            method: 'POST',
            path: '/api/protected',
            headers: {},
        });

        const context = createExecutionContextMock({ request });

        expect(sut.canActivate(context)).toEqual(true);
        expect(csrfTokenService.validateToken).toHaveBeenCalledWith(request);
    });
});
