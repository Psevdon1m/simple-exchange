const ethers = require("ethers");
export const tokens = (n) => {
    return ethers.utils.parseEther(n.toString());
};

export const EVM_REVERT = "VM Exception while processing transaction: revert";

export const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";
