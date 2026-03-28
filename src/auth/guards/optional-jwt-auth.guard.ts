import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to allow requests without authentication
  handleRequest(err: any, user: any) {
    // If there's no user, just return null (don't throw error)
    // This allows the request to proceed without authentication
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Always return true to allow the request through
    // The user will be attached if token is valid, null otherwise
    return super.canActivate(context) as Promise<boolean> | boolean;
  }

  // Override to prevent throwing error when no token is provided
  async canActivateAsync(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      // If authentication fails, still allow the request (user will be null)
      return true;
    }
  }
}
