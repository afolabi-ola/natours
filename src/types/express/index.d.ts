import { UserDocType } from '../../models/userModel';

declare global {
  namespace Express {
    interface Request {
      user: UserDocType;
    }
  }
}
