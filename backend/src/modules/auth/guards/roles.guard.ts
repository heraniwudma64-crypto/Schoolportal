import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: Role } }>();
    const rawUserRole = String(request.user?.role || '').toUpperCase();
    // Homeroom duty is an assignment on a TEACHER account, not a separate
    // database role. Accept the legacy label too, should an older token carry it.
    const userRole = rawUserRole === 'HOMEROOM_TEACHER' ? Role.TEACHER : rawUserRole;
    const normalizedRoles = requiredRoles.map((role) => String(role).toUpperCase());

    if (!userRole || !normalizedRoles.includes(userRole)) {
      throw new ForbiddenException('You are not allowed to access this resource');
    }

    return true;
  }
}
