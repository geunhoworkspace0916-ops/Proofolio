import { expect } from "chai";
import { ethers } from "hardhat";

async function deployProofolio() {
  const [owner, issuer, holder, other] = await ethers.getSigners();
  const proofolioFactory = await ethers.getContractFactory("Proofolio");
  const proofolio = await proofolioFactory.deploy();
  await proofolio.waitForDeployment();

  return { proofolio, owner, issuer, holder, other };
}

describe("Proofolio Phase 2", function () {
  const issuerName = "Code School";
  const issuerMetaURI = "https://codeschool.example/profile";
  const credentialMetaURI = "ipfs://credential-metadata";
  const credentialType = "Completion";

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
});
