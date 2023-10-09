import { dictionaryEntryAdd } from 'utils/dictionaryUtils';

export default async function (req, res) {
  try {
    const word = req.body.word || "";
    const definition = req.body.definition || "";
    if (word === "" || definition === "") {
      throw new Error("Missing word or definition.");
    }

    const entry = await dictionaryEntryAdd(word, definition);

    // Output the result
    res.status(200).json({
      result: {
        word: entry.word,
        definition: entry.definition
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
