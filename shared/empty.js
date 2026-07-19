// Browser stubs for common Node.js native exports used by libraries in browser context
export const promises = {
  writeFile: async () => {},
  readFile: async () => "",
};
export const readFileSync = () => "";
export const writeFileSync = () => {};
export const existsSync = () => false;
export const exec = () => {};
export const execSync = () => "";
export const spawn = () => {};

export class ReadStream {}
export const fstatSync = () => ({ size: 0 });
export const lstatSync = () => ({ size: 0 });
export const statSync = () => ({ size: 0 });
export const createReadStream = () => {};
export const isIP = () => 0;

export default {
  promises,
  readFileSync,
  writeFileSync,
  existsSync,
  exec,
  execSync,
  spawn,
  ReadStream,
  fstatSync,
  lstatSync,
  statSync,
  createReadStream,
  isIP,
};
