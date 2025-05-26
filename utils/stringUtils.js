export function getStringMonoLength(str = '') {
  let len = 0;

  for (const ch of str) {
    const cp = ch.codePointAt(0);

    // 1. Fast-path ASCII (U+0000–007F).
    if (cp <= 0x7f) {
      len += 1;
      continue;
    }

    // 2. Test for CJK & full-width ranges.
    const isCJK =
      // CJK Unified Ideographs (U+4E00–9FFF) & extensions
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x20000 && cp <= 0x2ebef) ||            // ext-B … ext-G
      // Hiragana (U+3040–309F)
      (cp >= 0x3040 && cp <= 0x309f) ||
      // Katakana (U+30A0–30FF) + phonetic extensions
      (cp >= 0x30a0 && cp <= 0x30ff) ||
      (cp >= 0x31f0 && cp <= 0x31ff) ||
      // Hangul syllables (U+AC00–D7AF)
      (cp >= 0xac00 && cp <= 0xd7af) ||
      // Full-width forms & wide symbols (U+FF01–FF60, U+FFE0–FFE6)
      (cp >= 0xff01 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6);

    len += isCJK ? 2 : 1;
  }

  return len;
}
