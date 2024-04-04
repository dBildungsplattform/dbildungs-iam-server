import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { PassportUser } from '../types/user.js';
import { PersonPermissions } from '../domain/person-permissions.js';

export const Permissions = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): Promise<PersonPermissions | undefined> => {
        const request: Request = ctx.switchToHttp().getRequest();
        const passportUser: PassportUser | undefined = request.passportUser;

        if (!passportUser) {
            return Promise.resolve(undefined);
        }

        return passportUser.personPermissions();
    },
);
