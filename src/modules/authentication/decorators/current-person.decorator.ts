import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { PersonPermissions } from '../domain/person-permissions.js';
import { PassportUser } from '../types/user.js';

export const CurrentPerson: () => ParameterDecorator = createParamDecorator<
    unknown,
    ExecutionContext,
    PersonPermissions
>((_data: unknown, ctx: ExecutionContext) => {
    const { user }: Request = ctx.switchToHttp().getRequest();
    if (!user)
        throw new UnauthorizedException(
            'CurrentUser missing in request context. This route requires jwt authentication guard enabled.',
        );

    return (user as unknown as PassportUser).personPermissions as PersonPermissions;
});
