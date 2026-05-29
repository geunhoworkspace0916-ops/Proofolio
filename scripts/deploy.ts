import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const Proofolio = await ethers.getContractFactory("Proofolio");
  const proofolio = await Proofolio.deploy();
  await proofolio.waitForDeployment();

  const address = await proofolio.getAddress();

  console.log(`Proofolio deployed: ${address}`);
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
