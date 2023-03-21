require("@nomiclabs/hardhat-waffle");
require('hardhat-abi-exporter');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // paths: {
  //   sources: "./contracts/TKR/TickerDao.sol",
  // },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
      },
      {
        version: "0.6.11",
      }
    ]
  },
  networks: {
    mainnet: {
      url: "https://eth-mainnet.alchemyapi.io/v2/TOsBQrnH33jGzGZPMwQ5u3IpbBydlwaL",
      accounts: [`0x${MAIN_HOT_KEY}`],
    },
    fork: {
      url: `http://localhost:8545`,
      accounts: [`0x${MAIN_HOT_KEY}`],
    },
    local: {
      url: `http://localhost:8545`,
      accounts: [`0x${GOERLI_PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${GOERLI_ALCHEMY_API_KEY}`,
      accounts: [`0x${MAIN_HOT_KEY}`],
    },
    goerliinfura: {
      url: 'https://goerli.infura.io/v3/a31dc24ca4e843e98597e3048dae047c',
      accounts: [`0x${GOERLI_PRIVATE_KEY}`],
    },
  },
  abiExporter: {
    path: './contracts/abi',
    clear: true,
    flat: true,
    only: [''],
    spacing: 2
  }
};
