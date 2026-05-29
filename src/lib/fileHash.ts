import { ethers } from "ethers";

export async function calculateFileKeccak256(file: File) {
  return ethers.keccak256(new Uint8Array(await file.arrayBuffer()));
}
