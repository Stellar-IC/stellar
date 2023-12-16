import { canisterId as internetIdentityCanisterId } from '../../declarations/internet_identity';

export const INTERNET_IDENTITY_HOST = `http://${internetIdentityCanisterId}.localhost:4943/`;

export const canisters = {
  INTERNET_IDENTITY: {
    id: internetIdentityCanisterId,
  },
};
