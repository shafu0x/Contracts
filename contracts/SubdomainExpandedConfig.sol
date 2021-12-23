//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// Deployed by 0x6a6418fB7980D92F664d6583e0AeaF7740bf8eeE on 12-22-21, compiled with 0.8.4

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Interfaces.sol";

// Operating the subdomain configurator:
// Set the controller of tkn.eth to the contract's address
// Run the migrations
// Return the tkn.eth controller to the former address

contract SubdomainConfig is Ownable {
    
    ENSRegistryWithFallback public ensRegistry;
    PublicResolver public publicResolversResolver;
    PublicResolver public publicResolver;

    bytes32 constant TKR_NAMEHASHED_NODE = 0x3fb945f27ea7fe9357d05b97b921898a90a2cbf8fc7e092e94bcacec9a80da0c;
    bytes32 constant RESOLVER_DOT_ETH_NAMEHASHED_NODE = 0xfdd5d5de6dd63db72bbc2d487944ba13bf775b50a80805fe6fcaba9b0fba88f5;

    constructor() {
        // ENS Registry is the same address on mainnet and testnets
        ensRegistry = ENSRegistryWithFallback(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);
        
        publicResolversResolver = PublicResolver(ensRegistry.resolver(RESOLVER_DOT_ETH_NAMEHASHED_NODE));
        publicResolver = PublicResolver(publicResolversResolver.addr(RESOLVER_DOT_ETH_NAMEHASHED_NODE));
    }
    
    // tickerLabel: the keccak256 of the ticker string only
    // owner: the address that will ultimately control the subdomain, most likely the multisig
    // finalNode: the namehash of the full domain; ie ticker.tkn.eth
    // mainnetTokenAddress: the address where the token contract for the ticker is located
    function configureSubdomain(bytes32 tickerLabel, address owner, bytes32 fullNameNode, address mainnetTokenAddress) onlyOwner public {
        ensRegistry.setSubnodeRecord(TKR_NAMEHASHED_NODE, tickerLabel, address(this), address(publicResolver), 0);
        publicResolver.setAddr(fullNameNode, mainnetTokenAddress);
        ensRegistry.setSubnodeOwner(TKR_NAMEHASHED_NODE, tickerLabel, owner);
    }

    function configureSubdomainFully(
        bytes32 tickerLabel,
        address owner,
        bytes32 fullNameNode,
        address mainnetTokenAddress,
        string[5] calldata metadata
    ) onlyOwner public {
        
        ensRegistry.setSubnodeRecord(TKR_NAMEHASHED_NODE, tickerLabel, address(this), address(publicResolver), 0);
        publicResolver.setAddr(fullNameNode, mainnetTokenAddress);
        publicResolver.setText(fullNameNode, "url", metadata[0]);
        publicResolver.setText(fullNameNode, "avatar", metadata[1]);
        // publicResolver.setText(fullNameNode, "description", description);
        publicResolver.setText(fullNameNode, "notice", metadata[2]);
        publicResolver.setText(fullNameNode, "com.twitter", metadata[3]);
        publicResolver.setText(fullNameNode, "com.github", metadata[4]);
        ensRegistry.setSubnodeOwner(TKR_NAMEHASHED_NODE, tickerLabel, owner);
    }

    function configureNonEthSubdomain(
        bytes32 tickerLabel,
        address owner,
        bytes32 fullNameNode,
        string[5] calldata metadata
    ) onlyOwner public {
        
        ensRegistry.setSubnodeRecord(TKR_NAMEHASHED_NODE, tickerLabel, address(this), address(publicResolver), 0);
        // publicResolver.setAddr(fullNameNode, mainnetTokenAddress);
        publicResolver.setText(fullNameNode, "url", metadata[0]);
        publicResolver.setText(fullNameNode, "avatar", metadata[1]);
        // publicResolver.setText(fullNameNode, "description", description);
        publicResolver.setText(fullNameNode, "notice", metadata[2]);
        publicResolver.setText(fullNameNode, "com.twitter", metadata[3]);
        publicResolver.setText(fullNameNode, "com.github", metadata[4]);
        ensRegistry.setSubnodeOwner(TKR_NAMEHASHED_NODE, tickerLabel, owner);
    }

    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes calldata _data) external returns(bytes4){
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }
}