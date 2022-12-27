# Contracts

Install and build the project from the `contracts/` directory

```bash
cd contracts/
yarn install
yarn build
```

The build artifacts will live in `contracts/artifacts/contracts/`
and `.json` ABI files. Contracts also must be built before calling them from
Typescript.

> Note: The yarn scripts are setup to use `TS_NODE_TRANSPILE_ONLY=1` to avoid circular dependencies.
See: https://github.com/NomicFoundation/hardhat/issues/2681

## Structure

This directory serves the blockchain smartcontract functionality.

Since this is a Hardhat project, the directory is structured like so

```
contracts/          # smartcontract source files
test/               # smartcontract tests
tasks/              # commandline tasks
scripts/            # scripts that run independent of hardhat environment
hardhat.config.ts   # config
```

# Testing via Local Network

Install and use the [avalanche-cli](https://github.com/ava-labs/avalanche-cli)

```
mkdir -p ~/.avalanche-cli
cp ./test/configs/test_genesis.json ./test/configs/test_sidecar.json ~/.avalanche-cli
avalanche subnet deploy --local test
```

Doing a curl for the chainid should return a valid response

```bash
curl --data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://127.0.0.1:11309/ext/bc/sBEvhRP4KyFZHsAsznyhfWZ4YKJL9ZqWrMzvcS4eANZXryk8h/rpc
```

## Running Tests

Simply run `yarn test`, with an optional `--network
[hardhat|local|toki-testnet]`.

```bash
yarn test
```

Run a single test using `--grep` for the test name, eg

```
yarn test --network local --grep atomic
```

# Administration

You can use custom tasks `adminSet` and `adminRead`
to manage a user's on-chain admin privileges.
Use the `--network` tag to specify which chain network to modify.

For local testing, the first address in `test_wallets.json` is the 'root'
admin for all contracts.

On the toki testnet, the env variable `TOKI_DEPLOYER_PRIVATE_KEY` is
treated as root account. Set this env variable to an private key with admin
privileges for testing.

Tasks are run as the first user in the accounts list.
See `hardhat.config.ts` for more details.

```bash
yarn hardhat --network local adminSet \
  --listname contract \
  --wallet 0xE96D4B5271aF7F84074f6313778f2f9803F15930 \
  --role deployer
```

For a full list of tasks, run `yarn hardhat help`.

## Contract Deployment

Contracts can be deployed and uploaded to AWS SecretManager with hardhat.

```bash
yarn hardhat --network toki-testnet \
deployMerchantToken \
  --merchantname mymerchant \
  --name "My Token" \
  --symbol "MYTO" \
  --logo "http://myurl.com/favicon.png"

Loaded 10 private keys from ./test_wallets.json
Loaded 10 private keys from ./test_wallets.json
Deploying MYTE token contract with 0x610bdD1Bbc008b25614Ac490e8Cb4ac3df60f8fc...
Transferring ownership to 0xeADEe1FD59E2CF57F3B1B84AAD92747645635652
Saving merchant/mymerchant/key to AWS SecretsManager
Sending request...
Done in 15.32s.

```

It will deploy using your private key, then tranferred ownership to a new
wallet, which is subsequently saved to AWS.
It is saved to `us-east-2` using your aws credentials in `~/.aws/credentials`
as `merchant/<merchantname>/key*`.

## Deployment Testnet/Mainnet Setup

Copy `.env.sample` to your own config

```
cp .env.sample .env
${YOUR_PREFERRED_EDITOR_HERE} .env
```

Specify the network you wish to interact with.
Copy your private key and paste it into your `.env` file. You can use a wallet like metamask or any wallet which can provide your plaintext private key.
It should look like this:
```
TOKI_NETWORK=testnet
TOKI_DEPLOYER_PRIVATE_KEY=56289e99c942adc093c9b511b69124f0dc52bfc14ac7a766b2deadbeef8d8027
```

## Network Settings

```
Network name: Toki Testnet
RPC URL: https://testnet.buildwithtoki.com/v0/rpc
Chain ID: 8655
Currency Symbol: TOKI
```

```
Network name: Toki Mainnet
RPC URL: https://mainnet.buildwithtoki.com/v0/rpc
Chain ID: 8654
Currency Symbol: TOKI
```
