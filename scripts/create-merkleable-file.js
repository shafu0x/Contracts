var json = require('../data/airdrop/ens_token_holders.json'); //(with path)

// var processedAddresses = new Array()
var processedAddresses = new Object()

for (var prop in json) {
  processedAddresses[json[prop].address] = 100000000000000000000

  // console.log(prop)
  // let claim = new Object
  // claim[json[prop].address] = 100
  // claim.address = json[prop].address
  // claim.amount = 100

  // processedAddresses.push(claim)

  // processedAddresses[json[prop]["address"]] = 100;
  
}
// console.log(processedAddresses)

let output = JSON.stringify(processedAddresses, null, 4)

var fs = require('fs');
fs.writeFile (__dirname + "/../data/airdrop/recipients.json", output, function(err) {
  if (err) throw err;
  console.log('complete');
  }
);


// fs.writeFile (__dirname + "/../data/airdrop/recipients.json", "sfasdfasdfs", function(err) {
//   if (err) throw err;
//   console.log('complete');
//   }
// );