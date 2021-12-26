const namehash = require('eth-ens-namehash')
const { ethers } = require("hardhat");

const ensAbi = require('../resources/ens_abi.json')
const publicResolverAbi = require('../resources/public_resolver_abi.json')
const erc20Abi = require('../resources/erc20_abi.json')

// const tokenData = require('../data/seed_erc20s.json')
const expandedTokenData = require('../data/subdomains/final-final-non-eth-migration-data.json')

const subdomainConfigAbi = require('../resources/subdomain_expanded_config_with_name_abi.json')

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

// const subdomainMigratorContractAddr = '0x31f0214C176640ba8320ED233AB7ED414633e091'
const subdomainMigratorContractAddr = '0xd160f2aa4e1be450448741eba5f5345567c19387'

const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const domainOwner = '0x3A7cbf0a90DC6755DdEE66886Dd26d4A6Ab64896'

let gasPrice = 42128698580
let priorityFee = 1500000000

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  let resolverAddr = await ethers.provider.resolveName("resolver.eth")

  const ensContract = new ethers.Contract(ensAddress, ensAbi, deployer)
  // const resolverContract = new ethers.Contract(resolverAddr, publicResolverAbi, deployer)

  const subdomainConfigContract = new ethers.Contract(subdomainMigratorContractAddr, subdomainConfigAbi, deployer)

  let pendingTokens = [];

  

  // for (let [key, token] of Object.entries(tokenData)) {
  //   for (let [key, token_contract] of Object.entries(token.token_contracts)) {
  //     if (token_contract.chain_id == 1) {

  //       // Check to see if tokens are in seed token data before running (first migration)
  //       for (let [key, expandedToken] of Object.entries(expandedTokenData)) {
  //         if (expandedToken.contract == token_contract.contract_address) {
  //           pendingTokens.push(expandedToken)
  //         }
  //       }

  //       // console.log(key, token_contract.contract_address);
  //       // token.mainnet_contract_address = token_contract.contract_address
  //       // pendingTokens.push(token)
  //     }
  //   }
  // }

  for (let [, token] of Object.entries(expandedTokenData)) {
    // if (token.failed_qa == true) {
    //   console.log("Skipping", token.verbose.data.name, "which failed QA")
    // } else {
      let normalizedTicker = namehash.normalize(token.data.symbol)
      let fullDomain = `${normalizedTicker}.tkn.eth`;
      // let resolvedName = await ethers.provider.resolveName(fullDomain);
      // console.log("resolvedName:", resolvedName, token.data.symbol)

      let fullNode = namehash.hash(fullDomain)
      let currentOwner = await ensContract.owner(fullNode)
      console.log("Domain owned by", domainOwner, "Symbol:", token.data.symbol, "Full domain:", fullDomain)

      if (currentOwner == "0x0000000000000000000000000000000000000000") {
        console.log(normalizedTicker, "not set. Registering and configuring addr.", )

        // Encode your domain strings for the blockchain
        let subdomainLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalizedTicker))
        let node = namehash.hash('tkn.eth')

        // Commented out for migrating non etherem based tokens
        // let tokenContract = new ethers.Contract(token.contract, erc20Abi, deployer)
        // let contractDecimals = await tokenContract.decimals();

        // console.log("Decimals for", normalizedTicker, ":", contractDecimals)

        // console.log(subdomainLabel, domainOwner, fullNode, token.contract)

        // NOTE: integrate the token NAME into the subdomain configurator contract
        // USE: token.data.name
        console.log(subdomainLabel, domainOwner, fullNode)
        let githubName = (token.data.links.repos_url && token.data.links.repos_url.github[0] && token.data.links.repos_url.github[0].split("/")[3]) ? token.data.links.repos_url.github[0].split("/")[3] : "";
        let resolverInput = [token.data.name, token.data.links.homepage[0], `https://gateway.pinata.cloud/ipfs/${token.avatar.IpfsHash}`, `{\"rev\":0}`, token.data.links.twitter_screen_name, githubName]; // Github account should always be the fourth in the array
        console.log("Resolver inputs", resolverInput);
        let newSubdomainAddrTx = await subdomainConfigContract.configureNonEthSubdomain(subdomainLabel, domainOwner, fullNode, resolverInput, { gasLimit: 1000000, maxFeePerGas: gasPrice, maxPriorityFeePerGas: priorityFee })

        console.log("Waiting for", normalizedTicker, "configureSubdomain transaction to mine at https://etherscan.io/tx/" + newSubdomainAddrTx.hash)
      } else {
        console.log("Domain already configured, skipping registration")
      }
    // }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });