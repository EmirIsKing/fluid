import fs from 'fs';
import path from 'path';

function scan(dir) {
  let results = [];
  let list;
  try {
    list = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }
  for (let file of list) {
    let filePath = path.join(dir, file);
    let stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(scan(filePath));
    } else {
      if (filePath.includes('connector-core') && filePath.endsWith('.d.ts')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const found = scan(path.resolve('node_modules'));
console.log("Found connector-core type files:", found);
