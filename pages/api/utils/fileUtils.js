import fs from 'fs';

export function fixLastRowNotEmpty(filePath) {
  if (isLastRowEmpty(filePath)) {
    return;
  }
  console.log(`Fixing last row of ${filePath}...`);
  addEmptyLineToLastRow(filePath);
}

function isLastRowEmpty(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  if (lines.length === 0) {
    // File is empty
    return false;
  }

  const lastLine = lines[lines.length - 1].trim();
  return lastLine === '';
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
