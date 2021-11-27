// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../vueDir/node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
//本合约类似积分银行（积分源头供应商）需要从erc20第一个地址先往本合约转入积分
contract Persons {
    address ercPointsSupplier = 0x82062A2769bA608e0A3d186EA25f66079eE1D32E;
    modifier onlyErcPointsSupplier() {
        require(msg.sender == ercPointsSupplier);
        _;
    }
    address ercAddress = 0xC40ed66aE773Ca6feA8493b9862A54671e096B80;

    function setErc(address ercaddress_, address ercPointsSupplier_) public {
        ercAddress = ercaddress_;
        ercPointsSupplier = ercPointsSupplier_;
    }

    struct Person {
        address payable account;
        uint ercPoints;
    }
    event ercPointsIncrease(address acc, uint ercPoints);
    mapping(address => Person) public persons;
    function getPersonErcPoints(address _acc) view public returns(uint) {
        return IERC20(ercAddress).balanceOf(address(_acc));
    }
    function getSupplierBalances() public view returns(uint) {
        return IERC20(ercAddress).balanceOf(ercPointsSupplier);
    }

    function rewardPersonErcPoints(address _acc, uint _ercPoints) public {
        IERC20(ercAddress).transfer(_acc, _ercPoints);
        persons[_acc].ercPoints += _ercPoints;
        emit ercPointsIncrease(_acc, _ercPoints);
    }

    //调用前，需要本人允许本合约使用我的积分  approve（本合约地址，允许积分数）
    function deductPersonErcPoints(address _acc, uint _ercPoints) public {
        IERC20(ercAddress).transferFrom(_acc, address(this),  _ercPoints);
        persons[_acc].ercPoints -= _ercPoints;
    }

    function getThisContractErcBalance() public view returns (uint) {
        return IERC20(ercAddress).balanceOf(address(this));
    }

}
