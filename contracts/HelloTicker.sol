//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Interfaces.sol";

interface ITicker {
    struct Metadata {
        address contractAddress;
        string url;
        string avatar;
        string description;
        string notice;
        string twitter;
        string github;
    }
    function addressFor(string calldata _name) external view returns (address);
    function infoFor(string calldata _name) external view returns (Metadata memory);
    function gasEfficientFetch(bytes32 namehash) external view returns (address);
}

contract HelloTicker {
    ITicker ticker;
    constructor() {
        ticker = ITicker(0x84cc49291C014468Ac8Ca34aE02A7A6875f37787); 
    }

    // Get an account's balance for a ticker symbol
    function balanceForAddress(address user, string calldata tickerSymbol) public view returns (uint) {
        IERC20 tokenContract = IERC20(ticker.addressFor(tickerSymbol));
        return tokenContract.balanceOf(user);
    }
    
    // Get a ticker's description
    function descriptionForTicker(string calldata tickerSymbol) public view returns (string memory description) {
        return ticker.infoFor(tickerSymbol).description;
    }
    
    // Get the full dataset for a ticker 
    function dataForTicker(string calldata tickerSymbol) public view returns (ITicker.Metadata memory info) {
        ITicker.Metadata memory data = ticker.infoFor(tickerSymbol);
        return data;
    }
}
