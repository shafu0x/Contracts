// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts@4.8.2/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@4.8.2/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts@4.8.2/security/Pausable.sol";
import "@openzeppelin/contracts@4.8.2/access/Ownable.sol";
import "@openzeppelin/contracts@4.8.2/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts@4.8.2/token/ERC20/extensions/ERC20Votes.sol";
import "./TokenRescuer.sol";

/// @custom:security-contact security@tkn.xyz
contract TokenDao is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, TokenRescuer {
    constructor(address owner) ERC20("TokenDao", "TKN") ERC20Permit("TokenDao") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
    {
        super._beforeTokenTransfer(from, to, amount);

        require(to != address(this), "TokenDao: Cannot transfer tokens to token contract");
        // Token transfers are only possible if the contract is not paused
        // OR if triggered by the owner of the contract
        require(!paused() || owner() == _msgSender(), "TokenDao: Token transfers are paused");
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
