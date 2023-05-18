pragma solidity >=0.8.0 <0.9.0;

contract Token {
    string public name = "Waffle";
    string public symbol = "WFL";
    uint256 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**decimals;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    constructor() public {
        totalSupply = 1000000 * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _amount) public returns (bool success) {
        require(_amount <= totalSupply);
        require(balanceOf[msg.sender] >= _amount);
        _transfer(msg.sender, _to, _amount);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal returns (bool) {
        require(_to != address(0));
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(balanceOf[_from] >= _value);
        require(allowance[_from][msg.sender] >= _value, "allowance exceeded");
        require(_transfer(_from, _to, _value), "transfer failed");
        allowance[_from][msg.sender] -= _value;
        return true;
    }
}
