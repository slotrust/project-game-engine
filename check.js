const https = require('https');
https.get('https://raw.githubusercontent.com/pmndrs/market-assets/main/models/weapon-blaster/model.gltf', (res) => {
  console.log('blaster:', res.statusCode);
});
https.get('https://raw.githubusercontent.com/pmndrs/market-assets/main/models/weapon-pistol/model.gltf', (res) => {
  console.log('pistol:', res.statusCode);
});
