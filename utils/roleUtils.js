import { parse } from 'csv-parse';
import fs from 'fs';
import { fixLastRowNotEmpty } from './fileUtils';

export async function getSystemRoles() {
  // Check if the file exists, if not create from role.csv.example
  if (!fs.existsSync('./role.csv')) {
    fs.copyFileSync('./role.csv.example', './role.csv');
    console.log('role.csv created from role.csv.example');
  }

  fixLastRowNotEmpty('role.csv');
  let roles = [];

  // System roles
  const csvRows = fs.createReadStream("./role.csv", { encoding: "utf8" })
                    .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // push role
  for await (const [role, prompt] of csvRows) {
    roles.push({
      role: role,
      prompt: prompt,
    });
  }
  return roles;
}

export async function getRolePrompt(roleName) {
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
