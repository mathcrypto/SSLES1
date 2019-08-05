# [SSLES](https://ethresear.ch/t/cryptographic-sortition-possible-solution-with-zk-snark/5102)
Single Secret Leader Election Snark (Block Proposer privacy Protocol using ZKSnarks):


Public parameters:

- A public random number `m `(emitted by the random beacon).
- The roothash of all the participants’ public keys: `rh`.
- `h = hash(signed(m))`

Secret parameters:

- Sign the message `m` by all participants: `signed(m)`
- The signer’s public key: `pk`
- Merkle path: `mp`

**Protocol**
- Generate `N` signature pairs pub/priv pair, we generate a SNARK (since participants have to send proof that they are eligible). 
- We choose one party `hash h` to be the block proposer.
- The party that was chosen will publish the sig that proves they are the right person.
- The other parties verify the sig to verify if  the msg m was actually signed by the corresponding private key.


**Checks performed by the ZK-SNARK:**
1. The public key belongs to one of the participants: the Merkle path `mp` leads from the public key `pk` to the root hash `rh`.

2. `Signed(m)` checks out against the public key `pk` and the random number `m`. 

3. `Hash(signed(m))` given in the public parameters is the hash of `signed(m)` given in the secret parameters.

4. `Signed(m)` in the secret parameters is the same `m given in the public parameters.



The zkSNARK prover is built as a native library which can plug-in to your application, when provided with the correct arguments it returns the zkSNARK proof as JSON. While you may think of zkSNARKs as being slow - the algorithms chosen for Miximus mean proofs can be made in 5 seconds, however we're still studying their security properties.

## Building

The following dependencies (for Linux) are needed:

 * cmake 3
 * g++ or clang++
 * gmp
 * libcrypto
 * boost
 * npm / nvm

### For OSX

Requires Brew and nvm.

```
make git-submodules # Pull sub-repositories
make -C ethsnarks mac-dependencies
make -C ethsnarks python-dependencies
nvm install --lts
make
```

### For Ubuntu:

```
make git-submodules # Pull sub-repositories
sudo make -C ethsnarks ubuntu-dependencies
make -C ethsnarks python-dependencies
nvm install --lts
make
```

### For CentOS / Amazon:

```
yum install cmake3 boost-devel gmp-devel
nvm install --lts
make git-submodules # Pull sub-repositories
make -C ethsnarks python-dependencies
make CMAKE=cmake3
```

