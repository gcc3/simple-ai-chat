import fs from 'fs';

export function fixLastRowNotEmpty(filePath) {
  if (isLastRowEmpty(filePath)) {
    return;
  }
  console.log(`Fixing last row in ${filePath} as it is not empty...`);
  addEmptyLineToLastRow(filePath);
}

function isLastRowEmpty(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');

  let lines = data.split('\n');
  let lastLine = lines[lines.length - 1];

  if (lastLine.trim() === '') {
      return true;
  } else {
      return false;
  }
}

function addEmptyLineToLastRow(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.trim().split('\n');

  if (lines.length === 0) {
    // File is empty
    fs.appendFileSync(filePath, '\n');
    return;
  }

  const lastLine = lines[lines.length - 1].trim();
  if (lastLine !== '') {
    fs.appendFileSync(filePath, '\n');
  }
}
