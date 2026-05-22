// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Memorial
 * @notice Leave a permanent on-chain tribute to someone you love.
 */
contract Memorial {
    event MemorialCreated(address indexed creator, uint256 indexed id, string dedicatedTo, uint256 timestamp);

    struct MemorialEntry {
        address creator;
        string dedicatedTo;   // who the memorial is for
        string message;       // your tribute message
        string relationship;  // e.g. "Father", "Friend", "Hero"
        uint256 timestamp;
    }

    MemorialEntry[] public memorials;
    mapping(address => uint256[]) public myMemorials;
    uint256 public totalMemorials;

    function createMemorial(
        string calldata dedicatedTo,
        string calldata message,
        string calldata relationship
    ) external {
        require(bytes(dedicatedTo).length > 0, "Name required");
        require(bytes(message).length > 0, "Message required");

        uint256 id = memorials.length;
        memorials.push(MemorialEntry({
            creator: msg.sender,
            dedicatedTo: dedicatedTo,
            message: message,
            relationship: bytes(relationship).length > 0 ? relationship : "In memory of",
            timestamp: block.timestamp
        }));

        myMemorials[msg.sender].push(id);
        totalMemorials++;
        emit MemorialCreated(msg.sender, id, dedicatedTo, block.timestamp);
    }

    function getRecentMemorials(uint256 count) external view returns (MemorialEntry[] memory) {
        uint256 len = memorials.length;
        uint256 start = len > count ? len - count : 0;
        MemorialEntry[] memory result = new MemorialEntry[](len - start);
        for (uint256 i = 0; i < result.length; i++) result[i] = memorials[start + i];
        return result;
    }

    function getAllMemorials() external view returns (MemorialEntry[] memory) { return memorials; }
}
