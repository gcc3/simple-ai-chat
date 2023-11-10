import { parse } from 'csv-parse';
import fs from 'fs';
import chalk from 'chalk';
import { fixLastRowNotEmpty } from './fileUtils';
import cw from 'csv-writer';

export async function dictionaryEntryListing() {
  fixLastRowNotEmpty('dict.csv');
  let words = [];

  const csvRows = fs.createReadStream("./dict.csv", { encoding: "utf8" })
                    .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find words
  for await (const [word, def] of csvRows) {
    words.push(word);
  }
  return words;
}

export async function dictionaryEntryAdd(word, definition) {
  fixLastRowNotEmpty('dict.csv');

  const csvWriter = cw.createObjectCsvWriter.createCsvWriter({
    path: 'dict.csv',
    header: [
        {id: 'word', title: 'word'},
        {id: 'definition', title: 'definition'}
    ],
    append: true,
    fieldDelimiter: ',',
    recordDelimiter: '\n',
    alwaysQuote: true,
  });

  const entry = {
    word: word,
    definition: definition,
  };

  await csvWriter
    .writeRecords([entry])
    .then(() => {
        console.log(chalk.greenBright("New entry added: " + JSON.stringify(entry)));
    });

  return entry;
}

export async function dictionarySearch({ topics, keywords, sub }) {
  let definitions = [];
  let score = 0;

  let definitions_topics = [];
  let definitions_keywords = [];
  let definitions_sub = [];

  const dict = fs.createReadStream("./dict.csv", { encoding: "utf8" })
                 .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find definitions
  for await (const entry of dict) {
    let isMatch = false;

    // topics has most priority
    for (const topic of topics) {
      if (entry[0].includes(topic)) {
        definitions_topics.push(entry);
        isMatch = true;
        break;
      }
    }
    if (isMatch) continue;

    // keywords has second priority
    for (const keyword of keywords) {
      if (entry[0].includes(keyword)) {
        definitions_keywords.push(entry);
        isMatch = true;
        break;
      }
    }
    if (isMatch) continue;

    // ner and morph has third priority
    for (const s of sub) {
      if (entry[0].includes(s)) {
        definitions_sub.push(entry);
        isMatch = true;
        break;
      }
    }
    if (isMatch) continue;
  }

  for (const def of definitions_topics) {
    definitions.push(def);
    score += 5;
    if (definitions.length >= 8) break;
  }

  for (const def of definitions_keywords) {
    definitions.push(def);
    score += 3;
    if (definitions.length >= 8) break;
  }

  for (const def of definitions_sub) {
    definitions.push(def);
    score += 1;
    if (definitions.length >= 8) break;
  }

  return { 
    def: definitions, 
    score: score, 
  };
}

export async function simpleDictionarySearch(keyword) {
  let entries = [];
  let entries_keywords = [];

  const csvRows = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"', from_line: 2}))

  // find definitions
  for await (const entry of csvRows) {
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