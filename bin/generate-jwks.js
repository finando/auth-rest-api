const { generateKeyPair, exportJWK } = require('jose');

(async () => {
  const { privateKey } = await generateKeyPair('RS512');

  console.log(JSON.stringify({ keys: [await exportJWK(privateKey)] }, null, 2));
})();
