import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
import HDKey from 'hdkey';
import bip39 from 'bip39';

// Completely insecure seed phrase. Do not use for any purpose other than testing.
// Resolves to "wnkwv-wdqb5-7wlzr-azfpw-5e5n5-dyxrf-uug7x-qxb55-mkmpa-5jqik-tqe"
const seed =
  'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af';

export const identityFromSeed = async () => {
  const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'));
  const addrnode = hdkey.derive("m/44'/223'/0'/0/0");

  return Secp256k1KeyIdentity.fromSecretKey(addrnode.privateKey);
};

export const identity = identityFromSeed();
