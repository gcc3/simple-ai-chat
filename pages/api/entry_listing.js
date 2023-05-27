import { parse } from 'csv-parse';
import fs from 'fs';

export default async function (req, res) {
  try {
    // const entries = [];
    const entries = await dictionaryEntrisListing();

    // Output the result
    res.status(200).json({
      result: {
        entries : entries
      },
    });
  } catch (error) {
    console.error(error);

    // Consider adjusting the error handling logic for your use case
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}

async function dictionaryEntrisListing() {
  let entries = [];
  const dict = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find entries
  for await (const [entry, def] of dict) {
    entries.push(entry);
  }
  return entries;
}