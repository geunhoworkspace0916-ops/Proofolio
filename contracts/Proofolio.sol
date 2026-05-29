// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title Proofolio
/// @notice Issuer registry and credential issuance contract for Proofolio.
contract Proofolio is ERC721, Ownable2Step {
    struct Issuer {
        string name;
        string metaURI;
        bool active;
        uint256 registeredAt;
    }

    struct Credential {
        address issuer;
        address holder;
        bytes32 dataHash;
        string credType;
        string metaURI;
        uint256 issuedAt;
        bool revoked;
    }

    error InvalidIssuerAddress();
    error IssuerNameRequired();
    error IssuerAlreadyRegistered(address issuer);
    error IssuerNotRegistered(address issuer);
    error IssuerNotActive(address issuer);
    error HolderRequired();
    error DataHashRequired();
    error CredentialTypeRequired();
    error CredentialNotFound(uint256 tokenId);
    error NotCredentialIssuer(address caller, uint256 tokenId);
    error CredentialAlreadyRevoked(uint256 tokenId);
    error SoulboundTransferDisabled();

    event IssuerRegistered(address indexed issuer, string name);
    event IssuerStatusChanged(address indexed issuer, bool active);
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed issuer,
        address indexed holder,
        bytes32 dataHash,
        string credType
    );
    event CredentialRevoked(uint256 indexed tokenId, address indexed issuer);

    mapping(address issuer => Issuer) public issuers;
    address[] public issuerList;

    mapping(uint256 tokenId => Credential) public credentials;
    mapping(address holder => uint256[] tokenIds) public holderTokenIds;

    uint256 public totalCredentials;

    modifier onlyActiveIssuer() {
        if (!_isRegisteredIssuer(msg.sender)) {
            revert IssuerNotRegistered(msg.sender);
        }
        if (!issuers[msg.sender].active) {
            revert IssuerNotActive(msg.sender);
        }
        _;
    }

    constructor() ERC721("Proofolio Credential", "PFOLIO") Ownable(msg.sender) {}

    function registerIssuer(
        address issuer,
        string calldata name,
        string calldata metaURI
    ) external onlyOwner {
        if (issuer == address(0)) {
            revert InvalidIssuerAddress();
        }
        if (bytes(name).length == 0) {
            revert IssuerNameRequired();
        }
        if (_isRegisteredIssuer(issuer)) {
            revert IssuerAlreadyRegistered(issuer);
        }

        issuers[issuer] = Issuer({
            name: name,
            metaURI: metaURI,
            active: true,
            registeredAt: block.timestamp
        });
        issuerList.push(issuer);

        emit IssuerRegistered(issuer, name);
    }

    function setIssuerActive(address issuer, bool active) external onlyOwner {
        if (issuer == address(0)) {
            revert InvalidIssuerAddress();
        }
        if (!_isRegisteredIssuer(issuer)) {
            revert IssuerNotRegistered(issuer);
        }

        issuers[issuer].active = active;

        emit IssuerStatusChanged(issuer, active);
    }

    /// @notice Issues a credential to a holder.
    /// @dev Do not include PII in credType or metaURI; on-chain data is public and permanent.
    function issueCredential(
        address holder,
        bytes32 dataHash,
        string calldata credType,
        string calldata metaURI
    ) external onlyActiveIssuer returns (uint256 tokenId) {
        if (holder == address(0)) {
            revert HolderRequired();
        }
        if (dataHash == bytes32(0)) {
            revert DataHashRequired();
        }
        if (bytes(credType).length == 0) {
            revert CredentialTypeRequired();
        }

        tokenId = totalCredentials + 1;
        totalCredentials = tokenId;

        credentials[tokenId] = Credential({
            issuer: msg.sender,
            holder: holder,
            dataHash: dataHash,
            credType: credType,
            metaURI: metaURI,
            issuedAt: block.timestamp,
            revoked: false
        });
        holderTokenIds[holder].push(tokenId);

        _mint(holder, tokenId);

        emit CredentialIssued(tokenId, msg.sender, holder, dataHash, credType);
    }

    function revokeCredential(uint256 tokenId) external {
        Credential storage credential = _credentialOrRevert(tokenId);

        if (credential.issuer != msg.sender) {
            revert NotCredentialIssuer(msg.sender, tokenId);
        }
        if (credential.revoked) {
            revert CredentialAlreadyRevoked(tokenId);
        }

        credential.revoked = true;

        emit CredentialRevoked(tokenId, msg.sender);
    }

    function verify(
        uint256 tokenId
    )
        external
        view
        returns (
            address issuer,
            string memory issuerName,
            bool issuerActive,
            address holder,
            bytes32 dataHash,
            string memory credType,
            uint256 issuedAt,
            bool revoked
        )
    {
        Credential storage credential = _credentialOrRevert(tokenId);
        Issuer storage issuerData = issuers[credential.issuer];

        return (
            credential.issuer,
            issuerData.name,
            issuerData.active,
            credential.holder,
            credential.dataHash,
            credential.credType,
            credential.issuedAt,
            credential.revoked
        );
    }

    function credentialsOf(address holder) external view returns (uint256[] memory) {
        return holderTokenIds[holder];
    }

    function isValid(uint256 tokenId) external view returns (bool) {
        if (!_credentialExists(tokenId)) {
            return false;
        }

        Credential storage credential = credentials[tokenId];
        return !credential.revoked && issuers[credential.issuer].active;
    }

    /// @notice On-chain SVG metadata so the credential renders in wallets/explorers.
    /// @dev Issuer-controlled strings are sanitized (`_sanitize`) to prevent SVG/JSON injection.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        Credential storage credential = _credentialOrRevert(tokenId);
        Issuer storage issuerData = issuers[credential.issuer];

        string memory credType = _sanitize(credential.credType);
        string memory issuerName = _sanitize(issuerData.name);
        string memory idStr = Strings.toString(tokenId);
        bool revoked = credential.revoked;
        string memory statusText = revoked ? "REVOKED" : "VALID";
        string memory statusColor = revoked ? "#ff5d5d" : "#41d18f";

        string memory svg = string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='320'>",
            "<rect width='100%' height='100%' rx='16' fill='#0b0e14'/>",
            "<text x='32' y='56' fill='#7c9cff' font-family='sans-serif' font-size='20' font-weight='bold'>PROOFOLIO</text>",
            "<text x='468' y='56' text-anchor='end' fill='",
            statusColor,
            "' font-family='sans-serif' font-size='16' font-weight='bold'>",
            statusText,
            "</text>",
            "<text x='32' y='154' fill='#ffffff' font-family='sans-serif' font-size='32' font-weight='bold'>",
            credType,
            "</text>",
            "<text x='32' y='192' fill='#9aa7c7' font-family='sans-serif' font-size='18'>",
            issuerName,
            "</text>",
            "<text x='32' y='286' fill='#5b6680' font-family='sans-serif' font-size='14'>Credential #",
            idStr,
            "</text></svg>"
        );

        string memory json = string.concat(
            '{"name":"Proofolio Credential #',
            idStr,
            '","description":"Verifiable credential issued on Proofolio (Sepolia).",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[',
            '{"trait_type":"Type","value":"',
            credType,
            '"},{"trait_type":"Issuer","value":"',
            issuerName,
            '"},{"trait_type":"Issuer Address","value":"',
            Strings.toHexString(credential.issuer),
            '"},{"trait_type":"Status","value":"',
            statusText,
            '"}]}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address from) {
        from = super._update(to, tokenId, auth);

        if (from != address(0)) {
            revert SoulboundTransferDisabled();
        }
    }

    function _credentialOrRevert(
        uint256 tokenId
    ) private view returns (Credential storage credential) {
        if (!_credentialExists(tokenId)) {
            revert CredentialNotFound(tokenId);
        }

        return credentials[tokenId];
    }

    function _credentialExists(uint256 tokenId) private view returns (bool) {
        return credentials[tokenId].issuer != address(0);
    }

    function _isRegisteredIssuer(address issuer) private view returns (bool) {
        return bytes(issuers[issuer].name).length != 0;
    }

    /// @dev Removes characters that could break out of the SVG/JSON string context.
    ///      Multi-byte UTF-8 (e.g. Korean) passes through unchanged.
    function _sanitize(string memory input) private pure returns (string memory) {
        bytes memory data = bytes(input);
        bytes memory out = new bytes(data.length);
        uint256 j;
        for (uint256 i; i < data.length; i++) {
            bytes1 c = data[i];
            if (
                c == 0x22 || // "
                c == 0x5c || // backslash
                c == 0x3c || // <
                c == 0x3e || // >
                c == 0x26 || // &
                uint8(c) < 0x20 // control chars
            ) {
                continue;
            }
            out[j] = c;
            j++;
        }
        assembly {
            mstore(out, j)
        }
        return string(out);
    }
}
