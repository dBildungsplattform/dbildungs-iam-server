import { Catch } from '@nestjs/common';
import { UserAuthenticationFailedError } from '../../../shared/error/index.js';
import { UiBackendExceptionFilter } from './ui-backend-exception-filter.js';

@Catch(UserAuthenticationFailedError)
export class UserAuthenticationFailedExceptionFilter extends UiBackendExceptionFilter<UserAuthenticationFailedError> {}
