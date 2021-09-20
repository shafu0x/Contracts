const namehash = require('eth-ens-namehash')
const { ethers } = require("hardhat");

const ensAbi = require('../resources/ens_abi.json')
const publicResolverAbi = require('../resources/public_resolver_abi.json')
const erc20Abi = require('../resources/erc20_abi.json')

const tokenData = require('../data/seed_erc20s.json')
const expandedTokenData = require('../data/final-final-migration-data.json')

const subdomainConfigAbi = require('../resources/subdomain_config_abi.json')

// Detailed instructions for running this script
// 1. Compile contract in remix or wherever
// 1. NOTE The address that deployed the contract will be the owner and therefore the only account that can query this contract
// 2. Paste ABI into resources/subdomain_config_abi.json
// 3. Paste deployed contract address into subdomainMigratorContractAddr variable below
// 4. Set the controller of tkn.eth to the contract address, the same as you just pasted into subdomainMigratorContractAddr
// 4-A Use https://app.ens.domains/name/tkn.eth/details to set the controller
// 5. Paste the private key for the migration address you will be using in the MAIN_HOT_KEY variable in `hardhat.config.js`
// 5-B Paste the private key into GOERLI_PRIVATE_KEY if you are testing on Goerli
// 5-C Deposit the desired amount of eth for gas into that migrator address
// 6. Set the url or the api key for the rpc provider you will use on Goerli or Mainnet in `hardhat.config.js`
// 7. Set the max gas price you are willing to spend in the gasPrice variable below
// 8. Configure your dataset
// 9. Run the script with `npx hardhat run scripts/subdomain-migrator.js --network mainnet`
// 10. Comment out the `waitForTransaction` await line if you want to populate the mempool and not wait for each transaction to finish

const subdomainMigratorContractAddr = '0x311090a53dee0f08cf72311798121ff0b9db6796'

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const domainOwner = '0x9200d8eFF8d972C79d1F692D61219CC652b43E0A'

let gasPrice = 60000000000
let priorityFee = 500000000

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  let resolverAddr = await ethers.provider.resolveName("resolver.eth")

  const ensContract = new ethers.Contract(ensAddress, ensAbi, deployer)
  // const resolverContract = new ethers.Contract(resolverAddr, publicResolverAbi, deployer)

  const subdomainConfigContract = new ethers.Contract(subdomainMigratorContractAddr, subdomainConfigAbi, deployer)

  let pendingTokens = [];

  for (let [key, token] of Object.entries(tokenData)) {
    for (let [key, token_contract] of Object.entries(token.token_contracts)) {
      if (token_contract.chain_id == 1) {

        // Check to see if tokens are in seed token data before running (first migration)
        for (let [key, expandedToken] of Object.entries(expandedTokenData)) {
          if (expandedToken.contract == token_contract.contract_address) {
            pendingTokens.push(expandedToken)
          }
        }

        // console.log(key, token_contract.contract_address);
        // token.mainnet_contract_address = token_contract.contract_address
        // pendingTokens.push(token)
      }
    }
  }

  for (let [, token] of Object.entries(pendingTokens)) {
    if (token.failed_qa == true) {
      console.log("Skipping", token.verbose.data.name, "which failed QA")
    } else {
      let normalizedTicker = namehash.normalize(token.verbose.data.symbol)
      let resolvedName = await ethers.provider.resolveName(`${normalizedTicker}.tkn.eth`)
      console.log("resolvedName:", resolvedName, token.verbose.data.symbol)

      if (!resolvedName) {
        console.log(normalizedTicker, "not set. Registering and configuring addr.", )

        // Encode your domain strings for the blockchain
        let subdomainLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalizedTicker))
        let node = namehash.hash('tkn.eth')
        let fullNode = namehash.hash(`${normalizedTicker}.tkn.eth`)

        let tokenContract = new ethers.Contract(token.contract, erc20Abi, deployer)
        let contractDecimals = await tokenContract.decimals();

        console.log("Decimals for", normalizedTicker, ":", contractDecimals)

        console.log(subdomainLabel, domainOwner, fullNode, token.contract)
        let newSubdomainAddrTx = await subdomainConfigContract.configureSubdomainFully(subdomainLabel, domainOwner, fullNode, token.contract, [token.url, token.avatar, `{\"rev\":0, \"decimals\":${contractDecimals}}`, token["com.twitter"], token["com.github"]], { gasLimit: 6000000, maxFeePerGas: gasPrice, maxPriorityFeePerGas: priorityFee })

        console.log("Waiting for", normalizedTicker, "configureSubdomain transaction to mine at https://goerli.etherscan.io/tx/" + newSubdomainAddrTx.hash)
        await ethers.provider.waitForTransaction(newSubdomainAddrTx.hash, 1);
        console.log(newSubdomainAddrTx)
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