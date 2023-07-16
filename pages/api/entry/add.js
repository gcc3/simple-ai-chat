import { dictionaryEntryAdd } from '../utils/dictionaryUtils';

export default async function (req, res) {
  try {
    const word = req.body.word || "";
    const defination = req.body.defination || "";
    if (word === "" || defination === "") {
      throw new Error("Missing word or defination.");
    }

    const entry = await dictionaryEntryAdd(word, defination);

    // Output the result
    res.status(200).json({
      result: {
        word: entry.word,
        defination: entry.defination
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
