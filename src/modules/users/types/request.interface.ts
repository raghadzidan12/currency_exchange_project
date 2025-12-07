import type { Request } from 'express';
import { User } from '../entities/user.entity';



export interface RequestWithSession extends Request {
  user?: User;
}
