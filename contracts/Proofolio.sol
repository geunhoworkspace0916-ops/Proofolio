// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Proofolio
/// @notice Issuer registry and credential issuance contract for Proofolio.
/// @dev Phase 2 intentionally excludes revocation, verification views, and soulbound transfer blocking.
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

    event IssuerRegistered(address indexed issuer, string name);
    event IssuerStatusChanged(address indexed issuer, bool active);
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed issuer,
        address indexed holder,
        bytes32 dataHash,
        string credType
    );

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

    function _isRegisteredIssuer(address issuer) private view returns (bool) {
        return bytes(issuers[issuer].name).length != 0;
    }
}
