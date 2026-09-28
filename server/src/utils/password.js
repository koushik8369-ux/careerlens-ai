import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}