// Script to fetch the top tokens with metadata, sort them by the number of onchain holders, check if they are already onchain, pin logo, and submit the subdomain configuration transaction with metadata
// It incorporates a subdomain migrator contract that will create a subdomain, and configure it's metadata, in one transaction
// If can be modified to fetch and persist sidechain contract addresses, and sort the token queue by that as well

// If you are devving this script, execute with hardhat.config.js environment variables with
// `npx hardhat run scripts/data-fetcher.js --network mainnet` or `npx hardhat run scripts/data-fetcher.js --network goerli`. also `fork` & `local`.

// To reset data and re-run this script fresh:
// TODO: Write reset instructions


// Detailed instructions for running this script
// 1. Compile contract in remix or wherever
// 1. NOTE The address that deployed the contract will be the owner and therefore the only account that can query this contract
// 2. Paste ABI into resources/subdomain_config_abi.json
// 3. Paste deployed contract address into subdomainMigratorContractAddress variables below (for both mainnet and goerli)
// 4. Set the controller of tkn.eth to the contract address, the same as you just pasted into subdomainMigratorContractAddr
// 4-A Use https://app.ens.domains/name/tkn.eth/details to set the controller
// 5. Paste the private key for the migration address you will be using in the MAIN_HOT_KEY variable in `hardhat.config.js`
// 5-B Paste the private key into GOERLI_PRIVATE_KEY if you are testing on Goerli
// 5-C Deposit the desired amount of eth for gas into that migrator address
// 6. Set the url or the api key for the rpc provider you will use on Goerli or Mainnet in `hardhat.config.js`
// 7. Set the max gas price you are willing to spend in the gasPrice variable below
// 8. Configure how many pages of token data you want to fetch in TOTAL_PAGES
// 8-A Configure what you want to sort the tokens by in allTokens.sort()
// 8-B Put a stop condition that ends the migration below: // XXX Halt conditions to end migration
// 9. Run the script with `npx hardhat run scripts/subdomain-migrator.js --network mainnet`
// 10. Comment out the `waitForTransaction` await line if you want to populate the mempool and not wait for each transaction to finish
// 11. Add the ticker json from TokensAddedForRegistry.txt to registry.tkn.eth
// 11-A Edit https://github.com/TickerDao/Registry by adding string in TokensAddedForRegistry.txt
// 11-B Upload that tns.json file to pinata and get the cid
// 11-C Put the tns.json CID in the contenthash field of registry.tkn.eth here https://app.ens.domains/name/registry.tkn.eth/details

const axios = require('axios');
const CIDTool = require('cid-tool')
const FormData = require('form-data')
const fs = require('fs');
const ipfsHash = require('ipfs-only-hash');
const namehash = require('eth-ens-namehash')
const { ethers } = require("hardhat");
const path = require('path');

const COINGECKO_API_BASE_URL = 'https://pro-api.coingecko.com/api/v3';
const COINGECKO_API_KEY = 'CG-5jyjpAG6n5bA5qCNkMp8MV2w';
const ETHEREUM_PLATFORM_ID = 'ethereum';
const ITEMS_PER_PAGE = 100;
const TOTAL_PAGES = 1;
const ETHERSCAN_API_BASE_URL = 'https://api.etherscan.io/api';
const ETHERSCAN_API_KEY = '94H2K5XFA3HQ8C5W8ASKYHHNCWV5MRP2QU';
const ETHPLORER_BASE_URL = 'https://api.ethplorer.io/'
const ETHPLORER_API_KEY = 'EK-gJHSs-EMSeNSN-ouNh3'
const PINATA_BEARER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YmFjMTI2Ny04ZDk3LTQ0MDktYTE2Ni04OTM1N2Q5ZDkwMTUiLCJlbWFpbCI6ImRpc2NvbmV0d29ya3NAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImRjZjE5MTA0Y2UwNmRhNjY3MDAwIiwic2NvcGVkS2V5U2VjcmV0IjoiYTNiY2Y0NTlkZWRhMjQ5ZjAzNTM3ZWVmYjVlZTBjNGNlZTM2Njc3ZmEwM2FlYTFhZjIxNTIxYzBiNDhkNmI0NyIsImlhdCI6MTY3OTIyNDc0M30.CY0kfUxr5d1JtnVHVRvKXh3QQcQchUDSp8GC75cgPHU'

axios.defaults.headers.common['x-cg-pro-api-key'] = COINGECKO_API_KEY; // Updated header

(async () => {
  // Mutable files to produce .txt file digeests after migration (TokensAddedForRegistry.txt, DataAddedToTKN.txt)
  let TokensAddedForRegistry = fs.readFileSync('TokensAddedForRegistry.txt', 'utf8')
  let DataAddedToTKN = fs.readFileSync('DataAddedToTKN.txt', 'utf8')

  // The amount you are willing to spend on gas for each transaction
  const gasPrice = 390128698580
  const priorityFee = 1500000000
  // The addresses that will be the 'owners' of the ticker subdomains
  const subdomainOwner_mainnet = '0x3A7cbf0a90DC6755DdEE66886Dd26d4A6Ab64896'
  const subdomainOwner_goerli = '0x9200d8eFF8d972C79d1F692D61219CC652b43E0A'
  // The addresses to the deployed migrator contracts
  const subdomainMigratorContractAddress_mainnet = ''
  const subdomainMigratorContractAddress_goerli = '0x0866d0b490A169530a9590F2921924AE5Fe53Ec4'

  const hre = require("hardhat");
  const [deployer] = await ethers.getSigners();

  // Init ENS Registry Contract
  const ensAbi = require('../resources/ens_abi.json')
  const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

  // Domain that will own the subdomains (currently the multisig)
  const subdomainOwner = hre.network.name == "goerli" ? subdomainOwner_goerli : hre.network.name == 'mainnet' ? subdomainOwner_mainnet : null
  if (!subdomainOwner) throw new Error('\n\nXXXXXX\nNo network name found. Pass in either "mainnet", or "goerli" like so: --network goerli \nor `npx hardhat run scripts/all-in-one-data-fetcher-and-migrator.js --network goerli`\nXXXXXX\n')
  
  console.log("Using network:", hre.network.name, "\nwith provider url", hre.network.config.url, "\nand subdomains will be owned by:", subdomainOwner)

  // Internal Migration helper contract init
  const subdomainConfigContractAddress = hre.network.name == "goerli" ? subdomainMigratorContractAddress_goerli : hre.network.name == 'mainnet' ? subdomainMigratorContractAddress_mainnet : null
  const subdomainConfigAbi = require('../resources/subdomain_expanded_config_with_name_and_decimal_abi.json')
  const subdomainConfigContract = new ethers.Contract(subdomainConfigContractAddress, subdomainConfigAbi, deployer)
  console.log("Using subdomain migrator contract deployed at address:", subdomainConfigContractAddress, "on", hre.network.name)

  // Token data fetching functions
  const pinFileToIPFS = async (filePath, symbol) => {
      const formData = new FormData();
      // const src = "path/to/file.png";
      
      const file = fs.createReadStream(filePath)
      formData.append('file', file)
      
      const metadata = JSON.stringify({
        name: symbol,
      });
      formData.append('pinataMetadata', metadata);
      
      const options = JSON.stringify({
        cidVersion: 1,
      })
      formData.append('pinataOptions', options);

      try{
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
          maxBodyLength: "Infinity",
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: `Bearer ${PINATA_BEARER_JWT}`
          }
        });
        console.log(res.data);
        return res.data;
      } catch (error) {
        console.log(error);
      }
  }

  async function getPinListByCID(ipfsCID) {
      try {
        const response = await axios({
          method: 'GET',
          url: 'https://api.pinata.cloud/data/pinList',
          params: {
            includeCount: 'false',
            hashContains: ipfsCID
          },
          headers: {
            Authorization: `Bearer ${PINATA_BEARER_JWT}`
          }
        });
    
        return response;
      } catch (error) {
        console.error('Error fetching pin list:', error.message);
      }
    }

    
  const downloadImage = async (url, cacheDir, filename) => {
      try {
        // Create cache directory if it does not exist
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
    
        // Check if the file already exists in the cache
        const filePath = path.join(cacheDir, filename);
        if (fs.existsSync(filePath)) {
          console.log(`File already exists in cache: ${filePath}`);
          const fileData = fs.readFileSync(filePath);
          const ipfsCIDV0 = await ipfsHash.of(fileData);
          let ipfsCID = CIDTool.base32(ipfsCIDV0)
          return { filePath, ipfsCID };
        }
    
        // Download the image using axios with responseType: 'stream'
        const response = await axios.get(url, { responseType: 'stream' });
    
        // Save the image to the cache directory
        const writer = fs.createWriteStream(filePath);
    
        // Collect data chunks to calculate IPFS hash later
        const dataChunks = [];
        response.data.on('data', (chunk) => dataChunks.push(chunk));
    
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          response.data.pipe(writer);
        });
    
        // Calculate IPFS hash
        const fileData = Buffer.concat(dataChunks);
        const ipfsCIDV0 = await ipfsHash.of(fileData);

        let ipfsCID = CIDTool.base32(ipfsCIDV0)

      //   return cidv1.toString();
    
        return { filePath, ipfsCID };
      } catch (error) {
        console.error('Error downloading image:', error.message);
      }
    };
    
    
  async function fetchTokenHoldersCount(contractAddress) {
      try {
        const response = await axios.get(
          `${ETHPLORER_BASE_URL}getTokenInfo/${contractAddress}?apiKey=${ETHPLORER_API_KEY}`
        );
    
        return response.data;
      } catch (error) {
        console.error(`Error fetching holders count for ${contractAddress}:`, error.message);
        return 0;
      }
    }

  async function fetchTokenMetadata(id) {
    try {
      const response = await axios.get(`${COINGECKO_API_BASE_URL}/coins/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching metadata for token ${id}:`, error.message);
      return null;
    }
  }

  async function getTopTokenDataAndMigrateOnchain() {
    try {
      // XXX Setup and verify the dispatch address before fetching token data
      console.log("Operating subdomain migrator contract from the EOA address:", deployer.address);
      const ether = Number(BigInt(await deployer.getBalance()) * BigInt(1e9)) / 10 ** 18;
      console.log("Account balance:", (Number(BigInt(await deployer.getBalance()) * BigInt(1e0)) / 10 ** 18).toString());
      const ensContract = new ethers.Contract(ensAddress, ensAbi, deployer)

      // XXX Query token data
      const allTokens = [];

      console.log("PHASE 1: FETCHING TOKEN DATA AND SORTING BY NUMBER OF HOLDERS")
      for (let page = 1; page <= TOTAL_PAGES; page++) {
        console.log('fetching page', page)
        const response = await axios.get(
          `${COINGECKO_API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${ITEMS_PER_PAGE}&page=${page}&sparkline=false&platform=${ETHEREUM_PLATFORM_ID}`
        );
        allTokens.push(...response.data);
      }

      for (const token of allTokens) {
        console.log("fetching token", token.id)
        token.metadata = await fetchTokenMetadata(token.id);
        // XXX Different sidechain contract addresses can be added and sorted for here as well
        // May need to locate a different api if ethplorer doesn't support sidechains
        if (token.metadata && token.metadata.platforms && token.metadata.platforms['ethereum']) {
          token.ethplorer_data = await fetchTokenHoldersCount(token.metadata.platforms['ethereum']);
          console.log("number of holders for", token.id, token.ethplorer_data.holdersCount)
        }
      }

      // XXX Modifying this allows the migration queue to be sorted by number of holders on different sidechains as well
      allTokens.sort(function(a, b) {
          if (a.ethplorer_data && a.ethplorer_data.holdersCount && b.ethplorer_data && b.ethplorer_data.holdersCount) {
              return b.ethplorer_data.holdersCount - a.ethplorer_data.holdersCount;
          } else if (a.ethplorer_data && a.ethplorer_data.holdersCount) {
              return -1;
          } else if (b.ethplorer_data && b.ethplorer_data.holdersCount) {
              return 1;
          } else {
              return 0;
          }
        });

      const top1000Tokens = allTokens.slice(0, 1000);
      console.log(`Fetched top 1000 Ethereum tokens sorted by the number of holders:`);

      // XXXX Parse data, check if data is already onchain, and then queue transactions XXXX
      console.log("PHASE 2: CHECKING FOR EXISTING TOKENS AND MIGRATING TOKENS THAT AREN'T ALREADY ONCHAIN")

      for (const token of allTokens) {
          // XXX Halt conditions to end migration
          if (!token.metadata.detail_platforms.ethereum) {
            throw new Error('\nNo more ethereum mainnet tokens in the list. Exiting.')
          }

          // Check if token is already onchain
          let normalizedTicker = namehash.normalize(token.symbol)
          let fullDomain = `${normalizedTicker}.tkn.eth`;
    
          let fullNode = namehash.hash(fullDomain)
          let currentOwner = await ensContract.owner(fullNode)
          console.log("Symbol:", token.symbol, " . Domain owned by", currentOwner, "Full domain:", fullDomain)

          // TODO: Compare datapoints to onchain data and produce a multicall txn to fill in outdated data in the resolver (may be subject to review)
          
          if (currentOwner == "0x0000000000000000000000000000000000000000") {
              console.log(normalizedTicker, "not set. Registering and configuring addr.", )

              console.log(token.symbol)
              console.log("Name", token.name)
              console.log("Contract (eth)", token.metadata.platforms.ethereum)
              console.log("Decimals (eth)", token.metadata.detail_platforms.ethereum.decimal_place)
              console.log("Github", token.metadata.links.repos_url.github[0])
              console.log("Twitter", token.metadata.links.twitter_screen_name)
              console.log("Website", token.metadata.links.homepage[0])
              console.log("Image", token.image)

              // Encode your domain strings for the blockchain
              let subdomainLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalizedTicker))
              let node = namehash.hash('tkn.eth')

              // Get filename for token avatar
              const url = new URL(token.image);
              const filename = path.basename(url.pathname);

              // Download token avatar file to cache, and calculate it's CID
              const { filePath, ipfsCID } = await downloadImage(token.image, './cache', filename);
              console.log("Processed", filename, "to", filePath, ipfsCID)

              // Check if token avatar is already pinned
              // For some reason downloadImage produces a different CID from the one returned by the pinata upload API, so this will usually return no detected pins
              const response = await getPinListByCID(ipfsCID);

              // If avatar is not pinned, pin to pinata
              let logoUploadResponse;
              if (response.data.rows.length == 0) {
                  logoUploadResponse = await pinFileToIPFS(filePath, token.symbol)
              }
              
              // For some reason donloadImage() produces the wrong CID, so we are going to use the CID from the pinata upload API onchain:
              const gatewayAvatarURL = `https://gateway.tkn.xyz/ipfs/${logoUploadResponse.IpfsHash}`
              const githubName = (token.metadata.links.repos_url && token.metadata.links.repos_url.github[0] && token.metadata.links.repos_url.github[0].split("/")[3]) ? token.metadata.links.repos_url.github[0].split("/")[3] : "";

              // console.log(subdomainLabel, domainOwner, fullNode)
              let resolverData = [token.name, token.metadata.links.homepage[0], gatewayAvatarURL, token.metadata.detail_platforms.ethereum.decimal_place.toString(), token.metadata.links.twitter_screen_name, githubName]; // Github account should always be the fourth in the array
              // console.log("Resolver inputs", resolverInput);
              // let newSubdomainAddrTx = await subdomainConfigContract.configureNonEthSubdomain(subdomainLabel, domainOwner, fullNode, resolverInput, { gasLimit: 1000000, maxFeePerGas: gasPrice, maxPriorityFeePerGas: priorityFee })
              let newSubdomainAddrTx = await subdomainConfigContract.configureSubdomainFullyWithVersion(
                subdomainLabel, subdomainOwner, fullNode, token.metadata.platforms.ethereum, resolverData, { 
                  gasLimit: 1000000, maxFeePerGas: gasPrice, maxPriorityFeePerGas: priorityFee 
                })
      
              console.log("Waiting for", normalizedTicker, `configureSubdomain transaction to mine at https://${hre.network.name == "goerli" ? "goerli." : ""}etherscan.io/tx/` + newSubdomainAddrTx.hash)

              // Comment this line out if you want to populate the mempool without waiting for each transaction to mine
              await newSubdomainAddrTx.wait();
              console.log("Token mined successfully", token.symbol)

              DataAddedToTKN = `${DataAddedToTKN}\n${token.symbol}\nContract address: ${token.metadata.platforms.ethereum}\n${resolverData}`
              fs.writeFileSync("DataAddedToTKN.txt", DataAddedToTKN);

              TokensAddedForRegistry = `${TokensAddedForRegistry}"${token.symbol.toUpperCase()}":{},`
              console.log("Tickers json to append to registry below, also accessible in the exported TokensAddedForRegistry.txt file")
              console.log(TokensAddedForRegistry)
              fs.writeFileSync("TokensAddedForRegistry.txt", TokensAddedForRegistry);
              // TODO: Create a digest to update the registry.tkn.eth ticker array file with tickers that have been added
              console.log()
          } 
      }

      fs.writeFile('top1000Tokens.json', JSON.stringify(top1000Tokens, null, 2), (err) => {
        if (err) {
          console.error('Error writing to file:', err.message);
        } else {
          console.log('Results saved to top1000Tokens.json');
        }
      });

    } catch (error) {
      console.error('Error state reached:', error.message);
    }
  }

  getTopTokenDataAndMigrateOnchain();

})();
