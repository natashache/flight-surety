var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "spatial must anchor open chuckle expand rice gun volcano mixture bar spawn";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};