import fs from 'fs';

const content = fs.readFileSync('node_modules/@particle-network/universal-account-sdk/dist/index.mjs', 'utf8');

// Find function injectMultiChainSignature or q
// Let's print the part of content containing "sendTransaction" and around it.
const sendTxIndex = content.indexOf('sendTransaction');
if (sendTxIndex !== -1) {
  console.log('--- AROUND sendTransaction ---');
  console.log(content.slice(Math.max(0, sendTxIndex - 1000), sendTxIndex + 1000));
}

// Let's search for function definitions like "function q(" or similar
// Since it's minified, it might be "function q(" or "const q=" or similar.
// Let's find "q as injectMultiChainSignature"
const exportIndex = content.indexOf('q as injectMultiChainSignature');
if (exportIndex !== -1) {
  console.log('\n--- AROUND EXPORT ---');
  console.log(content.slice(exportIndex - 200, exportIndex + 200));
}

// Let's find where "function q" or similar is defined
// Usually, it's defined earlier.
const qFuncIndex = content.indexOf('function q(');
if (qFuncIndex !== -1) {
  console.log('\n--- FOUND function q ---');
  console.log(content.slice(qFuncIndex, qFuncIndex + 1000));
} else {
  // Let's find "q="
  const qEqIndex = content.indexOf('q=');
  console.log('\n--- FOUND q= ---');
  console.log(content.slice(qEqIndex - 200, qEqIndex + 200));
}
