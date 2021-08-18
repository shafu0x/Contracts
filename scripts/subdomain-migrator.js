const namehash = require('eth-ens-namehash')

const ensAbi = require('../resources/ens_abi.json')
const tokenData = require('../data/tokens.json')

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  let resolverAddr = await ethers.provider.resolveName("resolver.eth")

  const ensContract = new ethers.Contract(ensAddress, ensAbi, deployer)

  let pendingTokens = [];

  for (let [key, token] of Object.entries(tokenData)) {
    for (let [key, token_contract] of Object.entries(token.token_contracts)) {
      if (token_contract.chain_id == 1) {
        // console.log(key, token_contract.contract_address);
        token.mainnet_contract_address = token_contract.contract_address
        pendingTokens.push(token)
      }
    }
  }

  console.log(pendingTokens)

  for (let [, token] of Object.entries(pendingTokens)) {
    if (token.failed_qa == true) {
      console.log("Skipping", token.name, "which failed QA")
    } else {
      console.log(token)
      let normalizedTicker = namehash.normalize(token.ticker)
      let resolvedName = await ethers.provider.resolveName(`${normalizedTicker}.tkn.eth`)
      console.log(resolvedName, token.ticker)

      let subdomainLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalizedTicker))
      console.log("subdomainLabel", subdomainLabel)

      let node = namehash.hash('tkn.eth') 
      console.log("node", node)

      let newSubdomainTx = await ensContract.setSubnodeRecord(node, subdomainLabel, deployer.address, resolverAddr, 0)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });