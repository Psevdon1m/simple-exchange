pragma solidity >=0.8.0 <0.9.0;

import "./Token.sol";

contract Exchange {
    address payable public feeAccount;
    uint256 public feePercent;
    address constant ETHER = address(0);
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCanceled;
    mapping(uint256 => bool) public orderFilled;

    uint256 public orderCount;

    event Deposit(address token, address user, uint256 amount, uint256 balance);

    event Withdraw(address token, address user, uint256 amount, uint256 balance);

    event OrderMade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);

    event CancelOrder(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);

    event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address userFill, uint256 timestamp);

    enum OrderStatus {
        preSell,
        preBuy,
        closed
    }

    OrderStatus public orderStatus;

    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address payable _feeAccount, uint256 _feePercent) public {
        orderStatus = OrderStatus.preSell;
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    fallback() external {
        revert();
    }

    function changeStatus(OrderStatus status) public returns (OrderStatus) {
        orderStatus = status;
        return orderStatus;
    }

    function depositEther() public payable {
        tokens[ETHER][msg.sender] += msg.value;
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        require(_token != ETHER, "cannot send ether using this function");
        require(_amount > 0, "amount should be valid");
        require((Token(_token).transferFrom(msg.sender, address(this), _amount)), "Token deposit error");
        tokens[_token][msg.sender] += _amount;

        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawEther(uint256 _amount) public payable {
        require(address(this).balance >= _amount); //TODO chose which functionality we need
        // if (address(this).balance <= _amount) {
        //     uint256 contractBalance = address(this).balance;
        //     tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender] - contractBalance;
        //     payable(msg.sender).transfer(contractBalance);
        //     emit Withdraw(ETHER, msg.sender, _amount, contractBalance);
        //     return;
        // }

        tokens[ETHER][msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, address(this).balance);
        return;
    }

    function withdrawTokens(address _token, uint256 _amount) public returns (bool success) {
        require(tokens[_token][msg.sender] >= _amount);
        require(_token != ETHER);
        tokens[_token][msg.sender] -= _amount;
        require(Token(_token).transfer(msg.sender, _amount), "Token transfered failed");
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
        return true;
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        orderCount += 1;
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);

        emit OrderMade(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id];
        require(_order.id == _id, "order does not exist");
        require(address(_order.user) == msg.sender, "The order does not belongs to you");

        orderCanceled[_id] = true;
        emit CancelOrder(_id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount);
        require(!orderCanceled[_id]);
        require(!orderFilled[_id]);
        _Order storage _order = orders[_id];
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        require(tokens[_tokenGet][msg.sender] >= _amountGet);
        require(tokens[_tokenGive][_user] >= _amountGive);
        uint256 _feeAmount = (_amountGive * feePercent) / 100;
        tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount);
        tokens[_tokenGet][_user] += _amountGet;
        tokens[_tokenGet][feeAccount] += _feeAmount;
        tokens[_tokenGive][_user] -= _amountGive;
        tokens[_tokenGive][msg.sender] += _amountGive;

        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, block.timestamp);
    }
}
