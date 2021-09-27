var json = require('../data/airdrop/ens_token_holders.json'); //(with path)

var processedAddresses = {};

for (var prop in json) {
  console.log(prop)
  processedAddresses[json[prop]["address"]] = 100;
}
console.log(processedAddresses)

var fs = require('fs');
fs.writeFile (__dirname + "/../data/airdrop/recipients.json", JSON.stringify(processedAddresses), function(err) {
  if (err) throw err;
  console.log('complete');
  }
);