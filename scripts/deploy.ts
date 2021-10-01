// @ts-nocheck

import { parseBalanceMap } from '../src/merkle/parse-balance-map'

import BalanceTree from "../src/merkle/balance-tree";

async function main() {
  const { ethers } = require("hardhat");
  const [deployer] = await ethers.getSigners();

  console.log("dfsfsd")
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TKRToken = await ethers.getContractFactory("TickerDao");
  const tkrToken = await TKRToken.deploy({gasLimit: 8000000, gasPrice: 20000000000});

  console.log("TKRToken address", tkrToken.address);
  let senderTknBalance = await tkrToken.balanceOf(deployer.address)
  console.log("MerkleDistributor TKN balance", senderTknBalance.toString())

  const Ticker = await ethers.getContractFactory("Ticker");
  const ticker = await Ticker.deploy({gasLimit: 8000000, gasPrice: 20000000000});

  console.log("Ticker utility contract address:", ticker.address);

  // var airdropData = require('../data/airdrop/example.json')
  var airdropData = require('../data/airdrop/recipients.json')

  console.log(deployer.address.toString())

  // Clobber merkleresult data to be able to dynamically include deployer address for testing
  // var airdropData = JSON.parse(`{ "${deployer.address.toString()}": 100 }`)

  const merkleResult = parseBalanceMap(airdropData)

  const merkleRoot = merkleResult.merkleRoot
  const tree = merkleResult.tree

  // console.log("MerkleRoot:", merkleRoot)

  const MerkleDistributor = await ethers.getContractFactory(
    "MerkleDistributor"
  );
  const merkleDistributor = await MerkleDistributor.deploy(
    tkrToken.address,
    merkleRoot, //dynamically calculate merkle root here with eoa used for testing
    {gasLimit: 8000000, gasPrice: 20000000000}
  );

  console.log("Merkle distributor contract address:", merkleDistributor.address);

  // Transfer tokens to merkle distributor for airdrop claims
  await tkrToken.transfer(merkleDistributor.address, ethers.utils.parseEther("100000"), {gasLimit: 8000000, gasPrice: 20000000000})

  console.log("MerkleDistributor TKN balance", await tkrToken.balanceOf(merkleDistributor.address))

  // console.log(merkleResult)

  // console.log(parseInt(merkleResult.claims[deployer.address].amount, 16))
  // return;
  // GENERATE MERKLE PROOF FOR CLAIM
  // const amount = ethers.utils.parseEther(merkleResult.claims[deployer.address].amount);
  const amount = merkleResult.claims[deployer.address].amount
  // const amount = ethers.utils.parseEther(merkleResult.claims[deployer.address].amount.toString())
  const airdropIndex = merkleResult.claims[deployer.address].index
  // console.log(airdropData)
  // return
  // const tree = new BalanceTree(airdropData);
  const proof = tree.getProof(airdropIndex, deployer.address, amount);

  console.log("merkleDistributor contract token address:", await merkleDistributor.token())
  console.log("merkleDistributor stored merkle root", await merkleDistributor.merkleRoot())
  // console.log("merkleDistributor TKR balance", await .merkleRoot())

  console.log("Check if address is claimed:", await merkleDistributor.isClaimed(airdropIndex))

  console.log("Pre claim distributor token balance", await tkrToken.balanceOf(deployer.address))

  await merkleDistributor.claim(airdropIndex, deployer.address, ethers.utils.parseEther("100"), proof, {gasLimit: 8000000, gasPrice: 20000000000})

  const newBalance = await tkrToken.balanceOf(deployer.address)
  const newBalanceNum = parseInt(newBalance._hex, 16)

  console.log("Check if address is claimed:", await merkleDistributor.isClaimed(airdropIndex))
  console.log("Deployer address TKN balance", newBalance.toString())
  // Test airdrop claim function
  // todo configure claim eoa address
}

const claimSIMP = async () => {
  const { default: userAirdrops } = await import("../lib/user_airdrops.json");
  const airdropIndex = userAirdrops.findIndex(
    (drop) => drop.account.toLowerCase() === account.id.toLowerCase()
  );
  const airdrop = userAirdrops[airdropIndex];

  if (!airdrop) {
    setError("Your address was not found");
    return;
  }

  const amount = ethers.utils.parseEther(airdrop.amount.toString());
  const tree = new BalanceTree(userAirdrops);
  const proof = tree.getProof(airdropIndex, account.id, amount);

  const signedContract = distributor.signedContract(
    account.provider,
    account.signer
  );
  const claim = await signedContract.claim(
    airdropIndex,
    account.id,
    amount,
    proof,
    {
      gasLimit: 100000,
    }
  );

  try {
    await claim.wait();
  } catch (error) {
    setError("There was an error claiming your tokens");
  }
}
;

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });