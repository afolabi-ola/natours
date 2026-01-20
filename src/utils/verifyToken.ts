import jwt from 'jsonwebtoken';

const verifyToken = (
  token: string,
  secret: string,
): Promise<{
  id: string;
  iat: number;
  exp: number;
}> =>
  new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          decoded as jwt.JwtPayload as {
            id: string;
            iat: number;
            exp: number;
          },
        );
      }
    });
  });

export default verifyToken;
