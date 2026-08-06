// Friendly name: Web Search
// Brave Search API, LLM Context endpoint.
// Unlike the normal web search API, it returns the extracted page content
// (text chunks, tables, code blocks) instead of links and short snippets,
// so the model can answer from it directly.
// Doc: https://api-dashboard.search.brave.com/documentation/services/llm-context
export default async function webSearch(paramObject, lang = "") {
  const { query, freshness } = paramObject;

  if (!query) return {
    success: false,
    error: "Invalid query.",
  }

  if (!process.env.BRAVE_SEARCH_API_KEY) return {
    success: false,
    error: "Web search is not configured, `BRAVE_SEARCH_API_KEY` is not set.",
  }

  const params = {
    q: query.split(/\s+/).slice(0, 50).join(" ").slice(0, 400),  // max 400 chars, 50 words
    country: "us",
    maximum_number_of_tokens: 8192,
  };
  if (freshness) params.freshness = freshness;

  // Search in the user's language, if it is supported by Brave.
  const searchLang = getSearchLang(lang);
  if (searchLang) params.search_lang = searchLang;

  const response = await fetch("https://api.search.brave.com/res/v1/llm/context?" + new URLSearchParams(params), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      success: false,
      error: "Web search failed (" + response.status + "). " + detail.slice(0, 500),
    }
  }

  const data = await response.json();

  // `grounding` groups the extracted content by type, e.g. `generic`, `news`, `faq`...
  // each entry has an `url`, a `title` and the extracted `snippets`.
  const grounding = data.grounding || {};
  const sources = data.sources || {};
  let entries = [];
  for (const type of Object.keys(grounding)) {
    if (Array.isArray(grounding[type])) entries.push(...grounding[type]);
  }

  if (entries.length === 0) {
    return {
      success: false,
      error: "No search result for \"" + query + "\".",
    }
  }

  let result = "";
  entries.map((entry, i) => {
    const source = sources[entry.url] || {};
    const age = source.age ? source.age[0] : null;  // human readable date

    result += "[" + (i + 1) + "] " + (entry.title || source.title || "Untitled") + "\n"
            + "URL: " + entry.url + "\n"
            + (age ? "Date: " + age + "\n" : "")
            + (entry.snippets || []).map(snippetToText).filter(Boolean).join("\n") + "\n\n";
  });

  return {
    success: true,
    message: "Query: " + query + "\n\n"
           + "Search result:\n\n" + result.trim(),
  }
}

// Convert the country-language code of the app, e.g. `ja-JP`, to a Brave `search_lang` code, e.g. `jp`.
// Returns null when the language is not supported by Brave, the search language is then decided by Brave.
function getSearchLang(langCode) {
  if (!langCode) return null;

  // Regional variants Brave distinguishes
  if (langCode === "en-GB") return "en-gb";
  if (langCode === "pt-BR") return "pt-br";
  if (langCode === "pt-PT") return "pt-pt";
  if (langCode === "zh-CN") return "zh-hans";
  if (langCode === "zh-HK" || langCode === "zh-TW") return "zh-hant";

  const searchLangs = {
    "ar": "ar",     "bn": "bn",     "de": "de",     "en": "en",
    "es": "es",     "fr": "fr",     "hi": "hi",     "it": "it",
    "ja": "jp",     "ko": "ko",     "nl": "nl",     "pl": "pl",
    "ru": "ru",     "sv": "sv",     "tr": "tr",
  };
  return searchLangs[langCode.split("-")[0]] || null;
}

// Snippets are plain strings, but structured content (tables, code, ...) comes as objects.
function snippetToText(snippet) {
  if (!snippet) return "";
  if (typeof snippet === "string") return snippet;
  return snippet.text || snippet.content || snippet.snippet || JSON.stringify(snippet);
}
