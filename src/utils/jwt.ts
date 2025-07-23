import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { config } from '../config';

const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export const generateToken = async (payload: object): Promise<string> => {
  return await signAsync(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = async (token: string): Promise<object | null> => {
  try {
    return await verifyAsync(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};