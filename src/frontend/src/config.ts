import { canisterId as internetIdentityCanisterId } from '../../declarations/internet_identity';

export const network =
  process.env.DFX_NETWORK ||
  (process.env.NODE_ENV === 'production' ? 'ic' : 'local');

export const INTERNET_IDENTITY_HOST =
  network === 'local'
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
    : 'https://identity.ic0.app';

export const canisters = {
  INTERNET_IDENTITY: {
    id: internetIdentityCanisterId,
  },
};
