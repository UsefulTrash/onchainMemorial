const hre = require("hardhat");
async function main() {
  console.log("🚀 Deploying Memorial...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("📬 From:", deployer.address);
  const Contract = await hre.ethers.getContractFactory("Memorial");
  const instance = await Contract.deploy();
  await instance.waitForDeployment();
  const address = await instance.getAddress();
  console.log("\n✅ Memorial deployed!");
  console.log("📍 Address:", address);
  console.log("🔍 https://testnet.arcscan.app/address/" + address);
  console.log("\nVITE_CONTRACT_ADDRESS=" + address);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
