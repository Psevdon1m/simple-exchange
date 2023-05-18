const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";

const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();

        const token = await Token.deployed();
        const exchange = await Exchange.deployed();
        const sender = accounts[0];
        const receiver = accounts[1];

        let amount = web3.utils.toWei("10000", "ether");

        await token.transfer(receiver, amount, { from: sender });
        const user1 = accounts[0];
        const user2 = accounts[1];
        amount = 1;

        await exchange.depositEther({ from: user1, value: web3.utils.toWei("0.2", "ether") });
        console.log(`deposited ${amount} ether from user1`);

        amount = 10000;
        await token.approve(exchange.address, web3.utils.toWei("10000", "ether"), { from: user2 });
        console.log(`Approved ${amount} tokens from user2`);

        await exchange.depositToken(token.address, web3.utils.toWei("10000", "ether"), {
            from: user2,
        });
        console.log(`deposited ${amount} tokens from user2`);

        let result;
        let orderId;

        result = await exchange.makeOrder(token.address, web3.utils.toWei("100", "ether"), ETHER_ADDRESS, web3.utils.toWei("0.01", "ether"), { from: user1 });
        console.log(`Successfully made order from ${user1}`);
        orderId = Number(result.logs[0].args.id);
        await exchange.cancelOrder(orderId, { from: user1 });
        console.log(`Successfully cancel order from ${user1}`);

        result = await exchange.makeOrder(token.address, web3.utils.toWei("10", "ether"), ETHER_ADDRESS, web3.utils.toWei("0.1", "ether"), { from: user1 });
        console.log(`Made order ${user1}`);

        orderId = Number(result.logs[0].args.id);

        await exchange.fillOrder(orderId, { from: user2 });
        console.log(`filled order ${user2}`);

        result = await exchange.makeOrder(token.address, web3.utils.toWei("30", "ether"), ETHER_ADDRESS, web3.utils.toWei("0.2", "ether"), { from: user1 });
        console.log(`Made order ${user1}`);

        orderId = Number(result.logs[0].args.id);
        await exchange.fillOrder(orderId, { from: user2 });
        console.log(`filled order ${user2}`);

        result = await exchange.makeOrder(token.address, web3.utils.toWei("50", "ether"), ETHER_ADDRESS, web3.utils.toWei("0.1", "ether"), { from: user1 });
        console.log(`Made order ${user1}`);

        orderId = result.logs[0].args.id;
        await exchange.fillOrder(orderId, { from: user2 });
        console.log(`filled order ${user2}`);
    } catch (error) {
        console.log(error);
    }
    callback();
};
