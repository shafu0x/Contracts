async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const SubdomainConfig = await ethers.getContractFactory("SubdomainConfig");
  const subdomainConfig = await SubdomainConfig.deploy();

  console.log("SubdomainConfig address", subdomainConfig.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });