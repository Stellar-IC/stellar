import { Identifier } from './identifier';

export const DEFAULT_BOUNDARY = 10;

export const START_NODE_ID = new Identifier([0]);
export const END_NODE_ID = new Identifier([15]);

export class IdentifierCollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentifierCollisionError';
  }
}
