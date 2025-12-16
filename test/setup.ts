// Jest test setup file
// BigInt JSON serialization fix for Prisma

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Enable nock to work with native fetch
import nock from 'nock';
nock.enableNetConnect(/localhost|127\.0\.0\.1/);

export {};
