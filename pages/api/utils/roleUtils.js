import { parse } from 'csv-parse';
import fs from 'fs';
import { fixLastRowNotEmpty } from './fileUtils';

export async function roleListing() {
  fixLastRowNotEmpty('dict.csv');
  let roles = [];

  const dict = fs.createReadStream("./role.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find words
  for await (const [role, prompt] of dict) {
    roles.push(role);
  }
  return roles;
}
