// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GreenCreditToken is ERC20Permit, ERC20Burnable, ERC20Pausable, Ownable {
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event TokensAwarded(address indexed to, address indexed awarder, uint256 amount, string reason);

    constructor(address initialOwner)
        ERC20("Green Credit Token", "GCT")
        ERC20Permit("Green Credit Token")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    function transferWithMetadata(address to, uint256 amount, string calldata metadata) external returns (bool) {
        _transfer(_msgSender(), to, amount);
        emit TokensAwarded(to, _msgSender(), amount, metadata);
        return true;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
