Instructions

1. Create subdomains: detailed instructions in scripts/subdomain-migrator.js

Run migrator
```
npx hardhat run scripts/subdomain-migrator.js --network mainnet
```

2. Deploy token


3. Create Merkle tree

A. Create a recipient file that the merkle script will like, run
```
node scripts/create-merkleable-file.js
```
Which can be adapted to parse different json data sources
The script will output to `data/airdrop/recipients.json`
B. Run `ts-node scripts/generate-merkle-root.ts --input data/airdrop/recipients.json`

C. (fully document this step) Get merkle root from the previous `generate-merkle-root.ts` transaction. Add the merkle root and the token contract address in the deployment variable fields for MerkleDistributor.sol
A. Transfer airdrop tokens to MerkleDistributor after deployment

- Copy recipients.json to App.js directory to satisfy react's include