require("chai").use(require("chai-as-promised")).should();
import { tokens, EVM_REVERT } from "./helpers.js";
const Token = artifacts.require("./Token");

contract("Token", ([deployer, receiver, exchange]) => {
    const name = "Waffle";
    const symbol = "WFL";
    const decimals = 18;
    const totalSupply = tokens(1000000).toString();
    let token;
    beforeEach(async () => {
        token = await Token.new();
    });
    describe("deployment", () => {
        it("tracks the name", async () => {
            const result = await token.name();
            result.should.equal(name);
        });
        it("tracks the symbol", async () => {
            const result = await token.symbol();
            result.should.equal(symbol);
        });
        it("tracks the totalSupply", async () => {
            const result = await token.totalSupply();
            result.toString().should.equal(totalSupply.toString());
        });

        it("check deployers balance", async () => {
            const result = await token.balanceOf(deployer);
            result.toString().should.equal(totalSupply.toString());
        });
    });

    describe("sending tokens", () => {
        let amount;
        let result;
        beforeEach(async () => {
            amount = tokens(100).toString();
            await token.approve(exchange, amount, { from: deployer });
        });
        describe("success", () => {
            beforeEach(async () => {
                result = await token.transferFrom(deployer, receiver, amount, {
                    from: exchange,
                });
            });
            it("transfers tokens", async () => {
                let receiverBalance = await token.balanceOf(receiver);
                let deployerBalance = await token.balanceOf(deployer);

                receiverBalance = await token.balanceOf(receiver);
                deployerBalance = await token.balanceOf(deployer);
                receiverBalance.toString().should.equal(tokens(100).toString());
                deployerBalance.toString().should.equal(tokens(999900).toString());
            });
            it("emits the event", async () => {
                const log = result.logs[0];
                log.event.should.equal("Transfer");
                const event = log.args;
                event.from.toString().should.equal(deployer, "from is incorrect");
                event.to.toString().should.equal(receiver, " to is incorrect");
                event.value.toString().should.equal(amount, "value is incorrect");
            });
        });
        describe("failure", () => {
            it("rejects if balance insuf", async () => {
                let invalidAmount;
                invalidAmount = tokens(10000000000);
                await token
                    .transfer(receiver, invalidAmount, {
                        from: deployer,
                    })
                    .should.be.rejectedWith(EVM_REVERT);
            });
            it("rejects if receiver is invalid", async () => {
                let invalidAmount;
                invalidAmount = tokens(100);
                await token.transfer(0x0, invalidAmount, {
                    from: deployer,
                }).should.be.rejected;
            });
        });
        describe("approving function", () => {
            let result;
            let amount;
            beforeEach(async () => {
                amount = tokens(100);
                result = await token.approve(exchange, amount, { from: deployer });
            });
            describe("success", () => {
                it("allocates an allowance for delegated token spending on exchange", async () => {
                    const allowance = await token.allowance(deployer, exchange);

                    allowance.toString().should.equal(amount.toString());
                });
            });
            describe("failure", () => {
                it("rejects insuf amount", async () => {
                    const invalidAmount = tokens(100000000000);
                    await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT);
                });
                it("rejects invalid receiver", async () => {
                    await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected;
                });
            });
        });
    });
});
