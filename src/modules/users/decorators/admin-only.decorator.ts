import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { Roles } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../constants';

export function AdminOnly() {
  return applyDecorators(
    Roles(UserRole.ADMIN),
    UseGuards(RolesGuard),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Admin access required' }),
  );
}
