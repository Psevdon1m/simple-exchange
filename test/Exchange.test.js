import { tokens, EVM_REVERT, ETHER_ADDRESS } from "./helpers";
require("chai").use(require("chai-as-promised")).should();

const Exchange = artifacts.require("./Exchange");
const Token = artifacts.require("./Token");

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
    let exchange;
    let token;
    const feePercent = 10;

    beforeEach(async () => {
        exchange = await Exchange.new(feeAccount, feePercent);
        token = await Token.new();
    });

    describe("deployment", () => {
        it("tracks fee account", async () => {
            const result = await exchange.feeAccount();
            result.should.equal(feeAccount);
        });
        it("tracks fee percent", async () => {
            const result = await exchange.feePercent();
            result.toString().should.equal(feePercent.toString());
        });
    });
    describe("fallback", () => {
        it("reverts when ether is sent", async () => {
            await exchange.sendTransaction({ value: 1, from: deployer }).should.be.rejected;
        });
    });
    describe("deposit tokens", () => {
        let amount = tokens(100).toString();
        let depositAmount = tokens(50).toString();
        beforeEach(async () => {
            await token.approve(exchange.address, amount, { from: deployer });
            await exchange.depositToken(token.address, depositAmount, { from: deployer });
        });
        describe("success", () => {
            it("tracks tokens deposit", async () => {
                //check token balance on token contract
                const exchangeTokenBalance = await token.balanceOf(exchange.address);
                exchangeTokenBalance.toString().should.equal(depositAmount);
                //check token balance on exchange contract
                const balance = await exchange.tokens(token.address, deployer);
                balance.toString().should.equal(depositAmount);
            });
        });
        describe("failure", () => {
            it("rejects Ether deposit", async () => {
                depositAmount = tokens(50).toString();
                await exchange.depositToken(ETHER_ADDRESS, depositAmount, { from: deployer }).should.be.rejected;
            });
            it("transfer more that allowed", async () => {
                depositAmount = tokens(500).toString();
                await exchange.depositToken(token.address, depositAmount, { from: deployer }).should.be.rejected;
            });
        });

        // it("tracks fee percent", async () => {
        //     const result = await exchange.feePercent();
        //     result.toString().should.equal(feePercent.toString());
        // });
    });

    describe("deposit Ether", async () => {
        let result;
        let amount = tokens(1).toString();

        beforeEach(async () => {
            result = await exchange.depositEther({ from: deployer, value: amount });
        });

        it("tracks ether deposit", async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, deployer);
            balance.toString().should.equal(amount);
        });
    });

    describe("withdraw ether", async () => {
        let result;
        let amount = tokens(1).toString();
        beforeEach(async () => {
            await exchange.depositEther({ from: deployer, value: amount });
        });

        describe("success", async () => {
            beforeEach(async () => {
                result = await exchange.tokens(ETHER_ADDRESS, deployer);
                await exchange.withdrawEther(amount, { from: deployer });
                result = await exchange.tokens(ETHER_ADDRESS, deployer);
            });
            it("reduces user ether balance on contract", async () => {
                result = await exchange.tokens(ETHER_ADDRESS, deployer);
                const contractBalance = await exchange.tokens(ETHER_ADDRESS, exchange.address);
                contractBalance.toString().should.equal(tokens(0).toString());
                result.toString().should.equal(tokens(0).toString());
            });
            it("reduces ether balance on contract", async () => {
                const contractBalance = await exchange.tokens(ETHER_ADDRESS, exchange.address);
                contractBalance.toString().should.equal(tokens(0).toString());
            });
        });

        describe("failure", async () => {
            it("rejects the transaction if SC balance is insuf", async () => {
                await exchange.withdrawEther(tokens(100), { from: deployer }).should.be.rejected;
            });
        });
    });

    describe("withdraw tokens", async () => {
        let result;
        let amount;
        describe("success", async () => {
            beforeEach(async () => {
                //deposit and approve tokens
                amount = tokens(100);
                await token.approve(exchange.address, amount, { from: deployer });
                await exchange.depositToken(token.address, amount, { from: deployer });
                //withdraw tokens
                result = await exchange.withdrawTokens(token.address, amount, { from: deployer });
            });

            it("checks user token balance after withdraw", async () => {
                const tokenBalance = await exchange.tokens(token.address, deployer);
                const userTokenBalanceOnTokenContract = await token.balanceOf(exchange.address);
                tokenBalance.toString().should.equal("0");
                userTokenBalanceOnTokenContract.toString().should.equal("0");
            });
            it("checks exchange balance after withdraw", async () => {
                const userTokenBalanceOnTokenContract = await token.balanceOf(exchange.address);
                userTokenBalanceOnTokenContract.toString().should.equal("0");
            });
        });

        describe("failure", async () => {
            it("rejects if token balance insuf", async () => {
                await exchange.withdrawTokens(token.address, tokens(1000)).should.be.rejected;
            });
            it("rejects if token balance insuf", async () => {
                await exchange.withdrawTokens(ETHER_ADDRESS, tokens(10)).should.be.rejected;
            });
        });
    });

    describe("checking user balance", async () => {
        beforeEach(async () => {
            await exchange.depositEther({ from: deployer, value: tokens(1).toString() });
        });
        it("returns user balance", async () => {
            const balance = await exchange.balanceOf(ETHER_ADDRESS, deployer);
            balance.toString().should.equal(tokens(1).toString());
        });
    });
    describe("making orders", async () => {
        beforeEach(async () => {
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, tokens(1), { from: deployer });
        });
        it("checks the amount of orders", async () => {
            const orders = await exchange.orderCount();
            orders.toString().should.equal("1");
        });
        it("checks the orders details", async () => {
            const order = await exchange.orders("1");
            order.id.toString().should.equal("1", "order id is wrong");
            order.user.should.equal(deployer, "user address does not match");
            order.tokenGet.should.equal(token.address, "Token address is incorrect");
            order.amountGet.toString().should.equal(tokens(1).toString(), "Amount give is wrong");
            order.tokenGive.should.equal(ETHER_ADDRESS, "token receiver addr is incorrect");
            order.amountGive.toString().should.equal(tokens(1).toString());
            order.timestamp.toString().length.should.be.at.least(1, "no timestamp");
        });
    });

    describe("filling the order", async () => {
        beforeEach(async () => {
            await exchange.depositEther({ from: user1, value: tokens(1) });
            await token.transfer(user2, tokens(100), { from: deployer });
            await token.approve(exchange.address, tokens(2), { from: user2 });
            await exchange.depositToken(token.address, tokens(2), { from: user2 });

            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, tokens(1), { from: user1 });
        });

        describe("fills the exact order", async () => {
            beforeEach(async () => {
                await exchange.fillOrder(1, { from: user2 });
            });
            it("executes the trade", async () => {
                let balance;
                balance = await exchange.balanceOf(token.address, user1);
                balance.toString().should.equal(tokens(1).toString(), "user 1 did not receive tokens");
                balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
                balance.toString().should.equal(tokens(1).toString(), "user 2 did not receive ether");
                balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
                balance.toString().should.equal(tokens(0).toString(), "user1 did not spent ether");
                balance = await exchange.balanceOf(token.address, user2);
                balance.toString().should.equal(tokens(0.9).toString(), "user2 did not receive tokens with fee included");
                const feeAccount = await exchange.feeAccount();
                balance = await exchange.balanceOf(token.address, feeAccount);
                balance.toString().should.equal(tokens(0.1).toString(), "fee were not credited to fee account");
            });

            it("updates filled order", async () => {
                const orderFilled = await exchange.orderFilled(1);
                orderFilled.should.equal(true);
            });
        });
    });

    describe("cancel orders", async () => {
        beforeEach(async () => {
            await exchange.depositEther({ from: deployer, value: tokens(1) });
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, tokens(1), { from: deployer });
        });
        it("checks if the order belongs to user", async () => {
            await exchange.cancelOrder("1", { from: feeAccount }).should.be.rejected;
        });
        it("checks if the order is canceled", async () => {
            await exchange.cancelOrder("1", { from: deployer });
            const isCanceled = await exchange.orderCanceled("1");
            isCanceled.should.equal(true);
        });
        it("checks if the order exists", async () => {
            await exchange.cancelOrder("2", { from: deployer }).should.be.rejected;
        });
    });
});
