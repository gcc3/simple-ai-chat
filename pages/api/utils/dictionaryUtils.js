import { parse } from 'csv-parse';
import fs from 'fs';

export async function dictionaryEntrisListing() {
  let entries = [];
  const dict = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find entries
  for await (const [entry, def] of dict) {
    entries.push(entry);
  }
  return entries;
}

export async function dictionarySearch({ topics, keywords, sub }) {
  let definations_topics = [];
  let definations_keywords = [];
  let definations_sub = [];

  const dict = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find definations
  for await (const entry of dict) {
    let isMatch = false;

    // topics has most priority
    for (const topic of topics) {
      if (entry[0].includes(topic)) {
        definations_topics.push(entry);
        isMatch = true;
        break;
      }
    }
    if (isMatch) continue;

    // keywords has second priority
    for (const keyword of keywords) {
      if (entry[0].includes(keyword)) {
        definations_keywords.push(entry);
        isMatch = true;
        break;
      }
    }
    if (isMatch) continue;

    // ner and morph has third priority
    for (const s of sub) {
      if (entry[0].includes(s)) {
        definations_sub.push(entry);
        isMatch = true;
        break;
      }
    }
    if (isMatch) continue;
  }

  let definations = [];
  for (const def of definations_topics) {
    definations.push(def);
    if (definations.length >= 8) break;
  }

  for (const def of definations_keywords) {
    definations.push(def);
    if (definations.length >= 8) break;
  }

  for (const def of definations_sub) {
    definations.push(def);
    if (definations.length >= 8) break;
  }

  return definations;
}