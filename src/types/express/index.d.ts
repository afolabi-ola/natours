import { UserDocType } from '../../models/userModel';

declare global {
  namespace Express {
    interface Request {
      user: UserDocType;
    }

    namespace Multer {
      interface File {
        filename?: string;
        publicId?: string;
      }
    }
  }
}
