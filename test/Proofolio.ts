import { expect } from "chai";
import { ethers } from "hardhat";

async function deployProofolio() {
  const [owner, issuer, holder, other] = await ethers.getSigners();
  const proofolioFactory = await ethers.getContractFactory("Proofolio");
  const proofolio = await proofolioFactory.deploy();
  await proofolio.waitForDeployment();

  return { proofolio, owner, issuer, holder, other };
}

describe("Proofolio", function () {
  const issuerName = "Code School";
  const issuerMetaURI = "https://codeschool.example/profile";
  const credentialMetaURI = "ipfs://credential-metadata";
  const credentialType = "Completion";

  async function registerIssuerAndIssueCredential() {
    const context = await deployProofolio();
    const dataHash = ethers.id("credential-file-v1");

    await context.proofolio.registerIssuer(
      context.issuer.address,
      issuerName,
      issuerMetaURI,
    );
    await context.proofolio
      .connect(context.issuer)
      .issueCredential(
        context.holder.address,
        dataHash,
        credentialType,
        credentialMetaURI,
      );

    return { ...context, dataHash, tokenId: 1n };
  }

  it("registers an issuer by the owner", async function () {
    const { proofolio, issuer } = await deployProofolio();

    await expect(
      proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI),
    )
      .to.emit(proofolio, "IssuerRegistered")
      .withArgs(issuer.address, issuerName);

    const storedIssuer = await proofolio.issuers(issuer.address);
    expect(storedIssuer.name).to.equal(issuerName);
    expect(storedIssuer.metaURI).to.equal(issuerMetaURI);
    expect(storedIssuer.active).to.equal(true);
    expect(storedIssuer.registeredAt).to.be.greaterThan(0n);
    expect(await proofolio.issuerList(0)).to.equal(issuer.address);
  });

  it("rejects issuer registration from non-owner accounts", async function () {
    const { proofolio, issuer, other } = await deployProofolio();

    await expect(
      proofolio
        .connect(other)
        .registerIssuer(issuer.address, issuerName, issuerMetaURI),
    )
      .to.be.revertedWithCustomError(proofolio, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("rejects duplicate issuer registration", async function () {
    const { proofolio, issuer } = await deployProofolio();

    await proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI);

    await expect(
      proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI),
    )
      .to.be.revertedWithCustomError(proofolio, "IssuerAlreadyRegistered")
      .withArgs(issuer.address);
  });

  it("validates issuer registration input", async function () {
    const { proofolio, issuer } = await deployProofolio();

    await expect(
      proofolio.registerIssuer(ethers.ZeroAddress, issuerName, issuerMetaURI),
    ).to.be.revertedWithCustomError(proofolio, "InvalidIssuerAddress");

    await expect(
      proofolio.registerIssuer(issuer.address, "", issuerMetaURI),
    ).to.be.revertedWithCustomError(proofolio, "IssuerNameRequired");
  });

  it("lets the owner update issuer active status", async function () {
    const { proofolio, issuer } = await deployProofolio();

    await proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI);

    await expect(proofolio.setIssuerActive(issuer.address, false))
      .to.emit(proofolio, "IssuerStatusChanged")
      .withArgs(issuer.address, false);

    const storedIssuer = await proofolio.issuers(issuer.address);
    expect(storedIssuer.active).to.equal(false);
  });

  it("allows an active registered issuer to issue a credential", async function () {
    const { proofolio, issuer, holder } = await deployProofolio();
    const dataHash = ethers.id("credential-file-v1");

    await proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI);

    await expect(
      proofolio
        .connect(issuer)
        .issueCredential(
          holder.address,
          dataHash,
          credentialType,
          credentialMetaURI,
        ),
    )
      .to.emit(proofolio, "CredentialIssued")
      .withArgs(1n, issuer.address, holder.address, dataHash, credentialType);

    expect(await proofolio.ownerOf(1n)).to.equal(holder.address);
    expect(await proofolio.totalCredentials()).to.equal(1n);
    expect(await proofolio.holderTokenIds(holder.address, 0)).to.equal(1n);

    const credential = await proofolio.credentials(1n);
    expect(credential.issuer).to.equal(issuer.address);
    expect(credential.holder).to.equal(holder.address);
    expect(credential.dataHash).to.equal(dataHash);
    expect(credential.credType).to.equal(credentialType);
    expect(credential.metaURI).to.equal(credentialMetaURI);
    expect(credential.issuedAt).to.be.greaterThan(0n);
    expect(credential.revoked).to.equal(false);
  });

  it("rejects credential issuance from inactive registered issuers", async function () {
    const { proofolio, issuer, holder } = await deployProofolio();
    const dataHash = ethers.id("credential-file-v1");

    await proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI);
    await proofolio.setIssuerActive(issuer.address, false);

    await expect(
      proofolio
        .connect(issuer)
        .issueCredential(holder.address, dataHash, credentialType, ""),
    )
      .to.be.revertedWithCustomError(proofolio, "IssuerNotActive")
      .withArgs(issuer.address);
  });

  it("rejects credential issuance from unregistered accounts", async function () {
    const { proofolio, holder, other } = await deployProofolio();
    const dataHash = ethers.id("credential-file-v1");

    await expect(
      proofolio
        .connect(other)
        .issueCredential(holder.address, dataHash, credentialType, ""),
    )
      .to.be.revertedWithCustomError(proofolio, "IssuerNotRegistered")
      .withArgs(other.address);
  });

  it("validates required credential fields before issuing", async function () {
    const { proofolio, issuer, holder } = await deployProofolio();
    const dataHash = ethers.id("credential-file-v1");

    await proofolio.registerIssuer(issuer.address, issuerName, issuerMetaURI);

    await expect(
      proofolio
        .connect(issuer)
        .issueCredential(ethers.ZeroAddress, dataHash, credentialType, ""),
    ).to.be.revertedWithCustomError(proofolio, "HolderRequired");

    await expect(
      proofolio
        .connect(issuer)
        .issueCredential(holder.address, ethers.ZeroHash, credentialType, ""),
    ).to.be.revertedWithCustomError(proofolio, "DataHashRequired");

    await expect(
      proofolio.connect(issuer).issueCredential(holder.address, dataHash, "", ""),
    ).to.be.revertedWithCustomError(proofolio, "CredentialTypeRequired");
  });

  it("lets the issuing institution revoke its credential", async function () {
    const { proofolio, issuer, tokenId } =
      await registerIssuerAndIssueCredential();

    await expect(proofolio.connect(issuer).revokeCredential(tokenId))
      .to.emit(proofolio, "CredentialRevoked")
      .withArgs(tokenId, issuer.address);

    const credential = await proofolio.credentials(tokenId);
    expect(credential.revoked).to.equal(true);
    expect(await proofolio.isValid(tokenId)).to.equal(false);
  });

  it("rejects revocation by accounts that did not issue the credential", async function () {
    const { proofolio, owner, other, tokenId } =
      await registerIssuerAndIssueCredential();

    await proofolio.registerIssuer(other.address, "Other Issuer", "");

    await expect(proofolio.connect(other).revokeCredential(tokenId))
      .to.be.revertedWithCustomError(proofolio, "NotCredentialIssuer")
      .withArgs(other.address, tokenId);

    await expect(proofolio.connect(owner).revokeCredential(tokenId))
      .to.be.revertedWithCustomError(proofolio, "NotCredentialIssuer")
      .withArgs(owner.address, tokenId);
  });

  it("rejects revocation for missing and already revoked credentials", async function () {
    const { proofolio, issuer, tokenId } =
      await registerIssuerAndIssueCredential();

    await expect(proofolio.connect(issuer).revokeCredential(999n))
      .to.be.revertedWithCustomError(proofolio, "CredentialNotFound")
      .withArgs(999n);

    await proofolio.connect(issuer).revokeCredential(tokenId);

    await expect(proofolio.connect(issuer).revokeCredential(tokenId))
      .to.be.revertedWithCustomError(proofolio, "CredentialAlreadyRevoked")
      .withArgs(tokenId);
  });

  it("rejects holder-to-holder transfers as soulbound", async function () {
    const { proofolio, holder, other, tokenId } =
      await registerIssuerAndIssueCredential();

    await expect(
      proofolio
        .connect(holder)
        .transferFrom(holder.address, other.address, tokenId),
    ).to.be.revertedWithCustomError(proofolio, "SoulboundTransferDisabled");

    expect(await proofolio.ownerOf(tokenId)).to.equal(holder.address);
  });

  it("returns accurate verification views and holder token lists", async function () {
    const { proofolio, issuer, holder, dataHash, tokenId } =
      await registerIssuerAndIssueCredential();

    const verification = await proofolio.verify(tokenId);
    expect(verification.issuer).to.equal(issuer.address);
    expect(verification.issuerName).to.equal(issuerName);
    expect(verification.issuerActive).to.equal(true);
    expect(verification.holder).to.equal(holder.address);
    expect(verification.dataHash).to.equal(dataHash);
    expect(verification.credType).to.equal(credentialType);
    expect(verification.issuedAt).to.be.greaterThan(0n);
    expect(verification.revoked).to.equal(false);

    expect(await proofolio.credentialsOf(holder.address)).to.deep.equal([
      tokenId,
    ]);
    expect(await proofolio.isValid(tokenId)).to.equal(true);
    expect(await proofolio.isValid(999n)).to.equal(false);

    await proofolio.setIssuerActive(issuer.address, false);

    const inactiveVerification = await proofolio.verify(tokenId);
    expect(inactiveVerification.issuerActive).to.equal(false);
    expect(await proofolio.isValid(tokenId)).to.equal(false);
  });

  it("rejects verification of missing credentials", async function () {
    const { proofolio } = await deployProofolio();

    await expect(proofolio.verify(999n))
      .to.be.revertedWithCustomError(proofolio, "CredentialNotFound")
      .withArgs(999n);
  });
});
