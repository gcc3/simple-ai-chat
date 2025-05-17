import fs from 'fs';
import path from 'path';


// Read the log.config file and parse the CSV content into an array of IPs
const readFilterList = async () => {
  try {
    const configFile = path.join(process.cwd(), 'log.config');

    // Create the `log.config` from `log.config.example` if it doesn't exist
    if (!fs.existsSync(configFile)) {
      const exampleFile = path.join(process.cwd(), 'log.config.example');
      const exampleContent = await fs.promises.readFile(exampleFile, 'utf8');
      await fs.promises.writeFile(configFile, exampleContent);
      console.log('Created log.config from log.config.example');
      return [];
    }

    const content = await fs.promises.readFile(configFile, 'utf8');
    const lines = content.split(/\r?\n/); // Split lines for both UNIX and Windows line endings
    const filteredIPs = lines.map(line => {
      const [key, value] = line.split(',');
      return value ? value.trim() : '';
    }).filter(Boolean);
    return filteredIPs;
  } catch (error) {
    console.error('Error reading filter list:', error);
    return [];
  }
};

// Simple async wrapper for fs.appendFile to use with async/await
const appendFileAsync = async (file, data) =>
  new Promise((resolve, reject) => {
    fs.appendFile(file, data, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

// Middleware function to log request details
const log = async (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const filteredIPs = await readFilterList();

  if (filteredIPs.includes(ip)) {
    return; // Skip logging for filtered IPs
  }

  const method = req.method;
  const url = req.url;
  const headers = req.headers;
  let body;

  // Handle body extraction for common body types (e.g., JSON, urlencoded)
  if (req.body) {
    try {
      body = JSON.stringify(req.body);
    } catch (err) {
      body = '[Unserializable Body]';
    }
  }

  // Initialize the data array
  const data = [
    `${new Date().toISOString()}`,
    `Method: ${method}`,
    `URL: ${url}`,
    `IP: ${ip}`,
    `Headers: ${JSON.stringify(headers)}`
  ];

  // Only add Body if it exists and is not an empty object
  if (body && body !== '{}' && body !== '[]') {
    data.push(`Body: ${body}`);
  }

  const logFilePath = path.join(process.cwd(), 'access.log');
  await appendFileAsync(logFilePath, "\n" + data.join(' | '));
};

export default log;