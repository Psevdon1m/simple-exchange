const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

module.exports = async function (deployer) {
    const feeAccount = await web3.eth.getAccounts();
    console.log(feeAccount);
    await deployer.deploy(Token);
    await deployer.deploy(Exchange, feeAccount[0], 10);
};
