import React, { useState } from "react";
import { ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link, Claim, MidHeader, ModalButton } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

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

async function performClaimQuery(updateTokenBalance) {
  console.log("claimmmm")
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = getDefaultProvider();
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/
  const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
  // A pre-defined address that owns some CEAERC20 tokens
  const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
  console.log({ tokenBalance: tokenBalance.toString() });

  updateTokenBalance(tokenBalance.toString());
  
  ethers.utils.parseEther("1.0")
  console.log(ethers)
  // const provider = new ethers.providers.Web3Provider(defaultProvider)

  // const signer = provider.getSigner()



  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const coolProvider = new ethers.providers.Def

// The Metamask plugin also allows signing transactions to
// send ether and pay to change state within the blockchain.
// For this, you need the account signer...
  const signer = coolProvider.getSigner()
  
  console.log(await signer.getAddress())

  console.log("d")
}

async function populateUIState() {

}

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
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
      {!provider ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

function ClaimButton({ label, updateTokenBalance }) {
  return (
    <ModalButton onClick={() => performClaimQuery(updateTokenBalance)}>
      {label}
    </ModalButton>
  )
}

var state = "safdfsfsd"

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  var greeter = "";

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body>
        <Page-wrapper class='some-page-wrapper'>
          <div className='row'>
            <div className='column'>
              <div className='blue-column'>
                Some copy {greeter} {tokenBalance}
              </div>
            </div>
            <div className='column'>
              <Claim>
                <title-text>1,000 TKR</title-text>
                <ClaimButton label={"Claim TKR"} updateTokenBalance={setTokenBalance} />
              </Claim>
            </div>
          </div>
          <div className='row'>
            <div className='double-column'>
              <div className='blue-column'>
                <MidHeader>What can I do with my airdrop?</MidHeader>
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='column'>
              <div className='green-column'>
                Some Text in Row 2, Column One
              </div>
            </div>
            <div className='column'>
              <div className='orange-column'>
                Some Text in Row 2, Column Two
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='double-column'>
              <div className='blue-column'>
                Some Text in row 3 double column 1
              </div>
            </div>
          </div>
        </Page-wrapper>
        <Image src={logo} alt="react-logo" />
        <p>
          Edit <code>packages/react-app/src/App.js</code> and save to reload.
        </p>
        <title-text> $TKR </title-text>
        <title-text>$TickerDao airdrop claim</title-text>
        {/* Remove the "hidden" prop and open the JavaScript console in the browser to see what this function does */}
        <Button onClick={() => readOnChainData()}>
          Read On-Chain Balance
        </Button>
        <Link href="https://ethereum.org/developers/#getting-started" style={{ marginTop: "8px" }}>
          Learn Ethereum
        </Link>
        <Link href="https://reactjs.org">Learn React</Link>
        <Link href="https://thegraph.com/docs/quick-start">Learn The Graph</Link>
      </Body>
    </div>
  );
}

export default App;
