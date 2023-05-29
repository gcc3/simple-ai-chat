import { parse } from 'csv-parse';
import fs from 'fs';
import chalk from 'chalk';
import { fixLastRowNotEmpty } from './fileUtils';

export async function dictionaryEntryListing() {
  let words = [];

  const dict = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find words
  for await (const [word, def] of dict) {
    words.push(word);
  }
  return words;
}

export async function dictionaryEntryAdd(word, defination) {
  fixLastRowNotEmpty('dict.csv');

  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: 'dict.csv',
    header: [
        {id: 'word', title: 'word'},
        {id: 'defination', title: 'defination'}
    ],
    append: true,
    fieldDelimiter: ',',
    recordDelimiter: '\n',
    alwaysQuote: true,
  });

  const entry = {
    word: word,
    defination: defination,
  };

  await csvWriter
    .writeRecords([entry])
    .then(() => {
        console.log(chalk.greenBright("New entry added: " + JSON.stringify(entry)));
    });

  return entry;
}

export async function dictionarySearch({ topics, keywords, sub }) {
  let definations = [];
  let score = 0;

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

  for (const def of definations_topics) {
    definations.push(def);
    score += 5;
    if (definations.length >= 8) break;
  }

  for (const def of definations_keywords) {
    definations.push(def);
    score += 3;
    if (definations.length >= 8) break;
  }

  for (const def of definations_sub) {
    definations.push(def);
    score += 1;
    if (definations.length >= 8) break;
  }

  return { 
    def: definations, 
    score: score, 
  };
}

export async function simpleDictionarySearch(keyword) {
  let entries = [];
  let entries_keywords = [];

  const dict = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find definations
  for await (const entry of dict) {
    // keywords
    if (entry[0].includes(keyword)) {
      entries_keywords.push(entry);
    }
  }

  for (const entry of entries_keywords) {
    entries.push(entry);
    if (entries.length >= 15) break;
  }
  
  return {
    entries: entries
  }
}