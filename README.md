Instructions

1. Create subdomains: **detailed instructions** in scripts/subdomain-migrator.js

Run migrator
```
npx hardhat run scripts/subdomain-migrator.js --network mainnet
```

2. Deploy token

After deployment, add token contract address to `/Users/oak/workspace/contracts copy/app/packages/contracts/src/addresses.js`

3. Create Merkle tree

A. Create a recipient file that the merkle script will like, run
```
node scripts/create-merkleable-file.js
```
Which can be adapted to parse different json data sources
The script will output to `data/airdrop/recipients.json`
Add some convenient addresses into recipients.json for metamask testing 
~~B. Run `ts-node scripts/generate-merkle-root.ts --input data/airdrop/recipients.json`~~

~~C. (fully document this step) Get merkle root from the previous `generate-merkle-root.ts` transaction. Add the merkle root and the token contract address in the deployment variable fields for MerkleDistributor.sol
A. Transfer airdrop tokens to MerkleDistributor after deployment~~

~~- Copy recipients.json to App.js directory to satisfy react's include~~


### Airdrop workflow
(assuming that the token has already been deployed)   
having run the create-merkleable-file script, make sure this is the final airdrop list you want
Comment out the non merkle distributor contract publish queries in deploy.ts
Run `hh run scripts/deploy.ts --network mainnet`
Add the deployed merkle distributor contract address to `/Users/oak/workspace/contracts copy/app/packages/contracts/src/addresses.js`
Transfer project tokens to the merkle distributor contract, this will be the inventory that airdrop claim queries collect from.
Presently the frontend needs a copy of `recipients.json` in the `./app/packages/react-app/src/App.js` directory to include it in the frontend

Test the query in metamask