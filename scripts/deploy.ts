import "@nomicfoundation/hardhat-ethers";
import hre from "hardhat";
import { Proofolio__factory } from "../typechain-types";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

  const proofolio = await new Proofolio__factory(deployer).deploy();
  await proofolio.waitForDeployment();

  const address = await proofolio.getAddress();

  console.log(`Proofolio deployed: ${address}`);
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
