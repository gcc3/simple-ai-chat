// logger.js
const fs = require('fs');
const path = require('path');

// Read the log.config file and parse the CSV content into an array of IPs
const readFilterList = async () => {
  try {
    const configFile = path.join(process.cwd(), 'log.config');
    const content = await fs.promises.readFile(configFile, 'utf8');
    const lines = content.split(/\r?\n/); // Split lines for both UNIX and Windows line endings
    const filteredIPs = lines.map(line => {
      const [key, value] = line.split(',');
      return value.trim();
    });
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

  // Check if the IP is in the filter list
  if (filteredIPs.includes(ip)) {
    // Skip logging for this IP
    return;
  }

  const userAgent = req.headers['user-agent'] || '';
  const data = `${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${ip} - Agent: ${userAgent}\n`;
  const logFilePath = path.join(process.cwd(), 'access.log');
  await appendFileAsync(logFilePath, data);
};

module.exports = log;