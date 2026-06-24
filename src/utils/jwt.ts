import jwt from 'jsonwebtoken';
import config from '../config';

export const generateToken = (payload: object): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): object | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as object;
  } catch (error) {
    return null;
  }
};
