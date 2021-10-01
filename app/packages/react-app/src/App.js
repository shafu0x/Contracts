import React, { useState } from "react";
import { ethers, ContractFactory } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link, Claim, MidHeader, ModalButton } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";
import { use } from "chai";

import { parseBalanceMap } from './merkle/parse-balance-map'
import BalanceTree from './merkle/balance-tree'

// const { default: userAirdrops } = import("./recipients.json");
import userAirdrops from './recipients.json'
import { green } from "chalk";
// import userAirdrops from './example.json'
console.log(userAirdrops);

async function readOnChainData() {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = getDefaultProvider();
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/
  const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
  // A pre-defined address that owns some CEAERC20 tokens
  const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
  console.log({ tokenBalance: tokenBalance.toString() });
}

async function performClaimQuery(updateTokenBalance, provider, airdropIndex) {
  console.log("claimmmm")
  // Should replace with the end-user wallet, e.g. Metamask
  // const defaultProvider = getDefaultProvider();
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/
  // const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
  // A pre-defined address that owns some CEAERC20 tokens
  // const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
  // console.log({ tokenBalance: tokenBalance.toString() });

  // let { default: userAirdrops } = import("./recipients.json");

  let signer = await provider.getSigner();
  const merkleDistributor = new Contract(addresses.merkleDistributor, abis.merkleDistributor, signer);

  console.log("The airdrops:", userAirdrops)
  const tree = new BalanceTree(userAirdrops)
  // const proof = tree.getProof(airdropIndex, userAddress, 100)
  const proof = tree.getProof(airdropIndex, userAddress, ethers.BigNumber.from(100))
  let claimOutcome = await merkleDistributor.claim(airdropIndex, userAddress, ethers.BigNumber.from(100), proof)

  // let claimOutcome = await merkleDistributor.claim()

  // updateTokenBalance(tokenBalance.toString());

  // ethers.utils.parseEther("1.0")
  // console.log(ethers)
  // const provider = new ethers.providers.Web3Provider(defaultProvider)

  // const signer = provider.getSigner()



  // const provider = new ethers.providers.Web3Provider(window.ethereum)
  // const signer = provider.getSigner()
  // let myAddress = await signer.getAddress()
  // console.log("My address is", myAddress)

  // const coolProvider = new ethers.providers.Def

  // The Metamask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  // const signer = coolProvider.getSigner()

  // console.log(await signer.getAddress())

  // console.log("d")

  // Subscribe to accounts change
  // provider.on("accountsChanged", (accounts) => {
  //   console.log("Accounts", accounts);
  // });

  // // Subscribe to chainId change
  // provider.on("chainChanged", (chainId) => {
  //   console.log("chainid", chainId);
  // });

  // // Subscribe to session disconnection
  // provider.on("disconnect", (code, reason) => {
  //   console.log("disconnect event", code, reason);
  // });
}

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  // let address = ''
  // if (provider) {
  //   let signer = await provider.getSigner();
  //   let address = await signer.getAddress();
  // }

  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
        // populateUIState(provider)
      }}
    >
      {!provider ? "Connect Wallet" : "Disconnect " + (userAddress ? userAddress.slice(0, 6) + '...' + userAddress.slice(userAddress.length - 4, userAddress.length) : userAddress)}
    </Button>
  );
}

function ClaimButton({ label, updateTokenBalance, provider, airdropIndex }) {
  return (
    <ModalButton onClick={() => performClaimQuery(updateTokenBalance, provider, airdropIndex)}
      style={{ marginBottom: 10, marginTop: 22 }}
    >
      {label}
    </ModalButton>
  )
}

async function getWalletData(provider, setTokenBalance, currentTokenBalance, setClaim, setError, setStatus, setAirdropIndex) {
  let signer = await provider.getSigner();
  let address = await signer.getAddress();
  userAddress = address.toLowerCase();
  
  // GET BALANCE, CHECK IF ADDRESS HAS BEEN CLAIMED AND CHECK IF ADDRESS IS CLAIMABLE HERE

  const merkleDistributor = new Contract(addresses.merkleDistributor, abis.merkleDistributor, provider);

  // let { default: userAirdrops } = import("./recipients.json")

  let airdrop = userAirdrops.find(element => element[userAddress.toLowerCase()] == 100);
  let claimIndex = userAirdrops.findIndex(element => airdrop);
  let airdropAmount = airdrop[userAddress.toLowerCase()];

  // var claimIndex = null;
  let isClaimed = null;


  if (!airdropAmount) {
    setError("Your address was not found");
    return;
  } else {
    // let recipientArr = Object.keys(userAirdrops)
    // claimIndex = userAirdrops.findIndex(
    //   (drop) => drop[userAddress] == 100
    // );

    isClaimed = await merkleDistributor.isClaimed(claimIndex);
    console.log("isClaimed for ", claimIndex, isClaimed)



    
    setAirdropIndex(claimIndex)
    setStatus(`🎉 You have ${airdropAmount} unclaimed TKR 🎉`)
    setClaim(airdropAmount)
  }

  

  // claimStatus = await merkleDistributor.


  const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, provider);

  // A pre-defined address that owns some CEAERC20 tokens
  tokenBalance = await ceaErc20.balanceOf(address);

  let balanceString = tokenBalance / Math.pow(10, 18)

  console.log("Got balance", balanceString);


  if (currentTokenBalance["balanceInt"]._hex != tokenBalance._hex) {
    console.log("Setting token balance from", currentTokenBalance["balanceString"])
    setTokenBalance({"balanceInt":tokenBalance, "balanceString":balanceString})
  }


  // renderWalletData(signer, address)
}

async function greenfield(provider) {
  // const { ethers } = require("hardhat");
  const deployer = await provider.getSigner();
  const address = await deployer.getAddress();

  console.log("dfsfsd")
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // const TKRToken = await ethers.getContractFactory("TickerDao");
  // const tkrToken = await TKRToken.deploy({gasLimit: 8000000, gasPrice: 20000000000});

  // console.log("TKRToken address", tkrToken.address);
  // let senderTknBalance = await tkrToken.balanceOf(deployer.address)
  // console.log("MerkleDistributor TKN balance", senderTknBalance.toString())

  // const Ticker = await ethers.getContractFactory("Ticker");
  // const ticker = await Ticker.deploy({gasLimit: 8000000, gasPrice: 20000000000});

  // console.log("Ticker utility contract address:", ticker.address);

  // var airdropData = require('../data/airdrop/example.json')
  var airdropData = require('./recipients.json')

  console.log(address.toString())

  // Clobber merkleresult data to be able to dynamically include deployer address for testing
  // var airdropData = JSON.parse(`{ "${deployer.address.toString()}": 100 }`)

  const merkleResult = parseBalanceMap(airdropData)

  const merkleRoot = merkleResult.merkleRoot
  const tree = merkleResult.tree

  // console.log("MerkleRoot:", merkleRoot)

  const merkleDistributor = new Contract(addresses.merkleDistributor, abis.merkleDistributor, deployer);

  const tkrToken = new Contract(addresses.ceaErc20, abis.erc20, provider);
  // const MerkleDistributor = await ethers.getContractFactory(
  //   "MerkleDistributor"
  // );
  // const merkleDistributor = await MerkleDistributor.deploy(
  //   tkrToken.address,
  //   merkleRoot, //dynamically calculate merkle root here with eoa used for testing
  //   {gasLimit: 8000000, gasPrice: 20000000000}
  // );

  console.log("Merkle distributor contract address:", merkleDistributor.address);

  // Transfer tokens to merkle distributor for airdrop claims
  // await tkrToken.transfer(merkleDistributor.address, ethers.utils.parseEther("100000"), {gasLimit: 8000000, gasPrice: 20000000000})

  console.log("MerkleDistributor TKN balance", await tkrToken.balanceOf(merkleDistributor.address))

  // console.log(merkleResult)

  // console.log(parseInt(merkleResult.claims[deployer.address].amount, 16))
  // return;
  // GENERATE MERKLE PROOF FOR CLAIM
  // const amount = ethers.utils.parseEther(merkleResult.claims[deployer.address].amount);
  const amount = merkleResult.claims[address].amount
  // const amount = ethers.utils.parseEther(merkleResult.claims[deployer.address].amount.toString())
  const airdropIndex = merkleResult.claims[address].index
  // console.log(airdropData)
  // return
  // const tree = new BalanceTree(airdropData);
  const proof = tree.getProof(airdropIndex, address, amount);

  console.log("merkleDistributor contract token address:", await merkleDistributor.token())
  console.log("merkleDistributor stored merkle root", await merkleDistributor.merkleRoot())
  // console.log("merkleDistributor TKR balance", await .merkleRoot())

  console.log("Check if address is claimed:", await merkleDistributor.isClaimed(airdropIndex))

  console.log("Pre claim distributor token balance", await tkrToken.balanceOf(address))

  // await merkleDistributor.claim(airdropIndex, address, ethers.utils.parseEther("100"), proof, {gasLimit: 8000000, gasPrice: 20000000000})
  await merkleDistributor.claim(airdropIndex, address, ethers.utils.parseEther("100"), proof)

  const newBalance = await tkrToken.balanceOf(address)
  const newBalanceNum = parseInt(newBalance._hex, 16)

  console.log("Check if address is claimed:", await merkleDistributor.isClaimed(airdropIndex))
  console.log("Deployer address TKN balance", newBalance.toString())
  // Test airdrop claim function
  // todo configure claim eoa address
}

function renderWalletData(signer, address) {
  console.log(signer, address)
}

var userAddress = null
var tokenBalance = null
var proof = null

function App() {
  // const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tokenBalance, setTokenBalance] = useState({"balanceInt":0, "balanceString":"0"})
  const [claim, setClaim] = useState(false)
  const [error, setError] = useState(false)
  const [status, setStatus] = useState(false)
  const [airdropIndex, setAirdropIndex] = useState(false)
  var greeter = "";

  // this.state = {
  //   userAddress: null
  // }

  // React.useEffect(() => {
  //   if (!loading && !error && data && data.transfers) {
  //     console.log({ transfers: data.transfers });
  //   }
  // }, [loading, error, data]);

  if (provider) {
    greenfield(provider);
    // greenfield(provider, setTokenBalance, tokenBalance, setClaim, setError, setStatus, setAirdropIndex);
  }

  // if (provider) {
  //   getWalletData(provider, setTokenBalance, tokenBalance, setClaim, setError, setStatus, setAirdropIndex);
  // }

  // handleUserAddressChange(userAddress); {
  //   this.setState({
  //     userAddress: userAddress
  //   });
  // }

  if (isLoggedIn) {
    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts) => {
      console.log("Accounts", accounts);
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId) => {
      console.log("chainid", chainId);
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log("disconnect event", code, reason);
    });
  }

  return (
    <div>
      <Header>
        <div>Balance: {tokenBalance["balanceString"]} TKR</div>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body>
        <Page-wrapper class='some-page-wrapper'>
          <div className='row'>
            <div className='column claim-box'>
              <div className='blue-column'>
                <h2 className="header-text">TickerDao Airdrop</h2>
                Here is some copy about the TickerDao airdrop
              </div>
            </div>
            <div className='column claim-div'>
              <title-text>{claim}</title-text>
              {status}
              <ClaimButton label={"Claim your TKR"} updateTokenBalance={setTokenBalance} provider={provider} airdropIndex={airdropIndex} />
              {/* <Claim>
              </Claim> */}
            </div>
          </div>
          <div className='row'>
            <div className='double-column top-margin'>
              <div className='blue-column'>
                {/* <h2 className='balance-label'>Your balance: {tokenBalance["balanceString"]} TKR</h2>
                <MidHeader>Thank you for becoming a steward and contributor to the ticker namespace</MidHeader> */}
                <MidHeader>What now?</MidHeader>
                <p><strong>Developers:</strong> Integrate with the TickerDao dataset</p>
                <p><strong>Contributors:</strong> Read the TickerDao <a href="https://whitepaper.tkr.eth.link">Constitution</a></p>
              </div>
            </div>
          </div>
          {/* <div className='row'>
            <div className='column'>
              <div className='green-column'>
                <h5>Governance</h5>
                TickerDao is focused on expanding the dataset and 
              </div>
            </div>
            <div className='column'>
              <div className='orange-column'>
                Staking
              </div>
            </div>
          </div> */}
          {/* <div className='row'>
            <div className='double-column'>
              <div className='blue-column'>
                <h3>What can I do with my airdrop?</h3>

              </div>
            </div>
          </div> */}
        </Page-wrapper>
        {/* <Image src={logo} alt="react-logo" /> */}
        {/* <p>
          Edit <code>packages/react-app/src/App.js</code> and save to reload.
        </p> */}
        {/* <title-text> $TKR </title-text>
        <title-text>$TickerDao airdrop claim</title-text> */}
        {/* Remove the "hidden" prop and open the JavaScript console in the browser to see what this function does */}
        {/* <Button onClick={() => readOnChainData()}>
          Read On-Chain Balance
        </Button> */}
        {/* <Link href="https://ethereum.org/developers/#getting-started" style={{ marginTop: "8px" }}>
          Learn Ethereum
        </Link>
        <Link href="https://reactjs.org">Learn React</Link>
        <Link href="https://thegraph.com/docs/quick-start">Learn The Graph</Link> */}
      </Body>
    </div>
  );
}

export default App;
