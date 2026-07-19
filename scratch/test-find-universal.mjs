import fs from 'fs';
const content = fs.readFileSync('node_modules/@particle-network/universal-account-sdk/dist/index.mjs', 'utf8');
const searchWord = 'createUniversalTransaction';
let index = 0;
while (true) {
  index = content.indexOf(searchWord, index);
  if (index === -1) break;
  console.log(`Found "${searchWord}" at index ${index}:`);
  console.log(content.slice(Math.max(0, index - 200), index + 200));
  index += searchWord.length;
}
