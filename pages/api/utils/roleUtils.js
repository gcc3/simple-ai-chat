import { parse } from 'csv-parse';
import fs from 'fs';
import { fixLastRowNotEmpty } from './fileUtils';

export async function roleListing() {
  fixLastRowNotEmpty('role.csv');

  let roles = [];
  const csvRows = fs.createReadStream("./role.csv", { encoding: "utf8" })
                    .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // push role
  for await (const [role, prompt] of csvRows) {
    roles.push(role);
  }
  return roles;
}

export async function rolePrompt(roleName) {
  fixLastRowNotEmpty('role.csv');

  const csvRows = fs.createReadStream("./role.csv", { encoding: "utf8" })
                    .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find role
  for await (const role of csvRows) {
    if (roleName === role[0]) {
      return role[1];  // prompt
    }
  }
  return "";
}
