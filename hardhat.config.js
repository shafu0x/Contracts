require("@nomiclabs/hardhat-waffle");

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
  solidity: "0.8.4",
    networks: {
      mainnet: {
        // url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        url: `http://localhost:8545`,
        accounts: [`0x${MAIN_HOT_KEY}`],
      },
      goerli: {
        url: `https://eth-goerli.alchemyapi.io/v2/${GOERLI_ALCHEMY_API_KEY}`,
        accounts: [`0x${GOERLI_PRIVATE_KEY}`],
      },
      goerliinfura: {
        url: 'https://goerli.infura.io/v3/a31dc24ca4e843e98597e3048dae047c',
        accounts: [`0x${GOERLI_PRIVATE_KEY}`],
      },
  },
};
