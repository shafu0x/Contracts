const namehash = require('eth-ens-namehash')

const ensAbi = require('../resources/ens_abi.json')
const publicResolverAbi = require('../resources/public_resolver_abi.json')
const tokenData = require('../data/tokens.json')

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  let resolverAddr = await ethers.provider.resolveName("resolver.eth")
  // let resolverAddr = await ethers.provider.resolveName("resolver.eth")
  // let resolverAddr = "0x4B1488B7a6B320d2D721406204aBc3eeAa9AD329"
  // console.log(resolverAddr, "0x4b1488b7a6b320d2d721406204abc3eeaa9ad329")

  const ensContract = new ethers.Contract(ensAddress, ensAbi, deployer)
  const resolverContract = new ethers.Contract(resolverAddr, publicResolverAbi, deployer)

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
      console.log("resolvedName:", resolvedName, token.ticker)

      if (!resolvedName) {
        console.log(normalizedTicker, "not set. Registering and configuring addr.", )

        let subdomainLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalizedTicker))
        console.log("subdomainLabel", subdomainLabel)

        let node = namehash.hash('tkn.eth') 
        console.log("node", node)

        let newSubdomainTx = await ensContract.setSubnodeRecord(node, subdomainLabel, deployer.address, resolverAddr, 0)
        console.log("Waiting for", normalizedTicker, "subnodeRecord transaction to mine at https://goerli.etherscan.io/tx/" + newSubdomainTx.hash)
        await ethers.provider.waitForTransaction(newSubdomainTx.hash, 1);

        let fullNode = namehash.hash(`${normalizedTicker}.tkn.eth`)
        let newSubdomainAddrTx = await resolverContract.setAddr(fullNode, token.mainnet_contract_address, { gasLimit: 200000, gasPrice: 20000000000 })

        console.log("Waiting for", normalizedTicker, "setAddr transaction to mine at https://goerli.etherscan.io/tx/" + newSubdomainAddrTx.hash)
        await ethers.provider.waitForTransaction(newSubdomainAddrTx.hash, 1);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });