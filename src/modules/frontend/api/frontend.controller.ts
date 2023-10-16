import { Controller, Post, Res, Session, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthenticatedGuard } from './authentication.guard.js';
import { AuthenticationInterceptor } from './authentication.interceptor.js';
import { SessionData } from './session.js';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
@UseInterceptors(AuthenticationInterceptor)
export class FrontendController {
    @Post('login')
    @ApiAcceptedResponse({ description: 'The person was successfully logged in.' })
    public login(@Session() session: SessionData): string {
        session.user_id = '';

        return 'Login!';
    }

    @UseGuards(AuthenticatedGuard)
    @Post('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(@Session() session: SessionData, @Res() res: Response): void {
        session.destroy((err: unknown) => {
            if (err) {
                res.status(400).send('Error while logging out');
            } else {
                res.status(200).send('Logged out');
            }
        });
    }
}
