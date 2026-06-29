const db = require('../database/db');

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[¿?¡!,;.:()\-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function score(sentence, queryTokens) {
  const tokens = tokenize(sentence);
  let matchCount = 0;
  for (const qt of queryTokens) {
    for (const t of tokens) {
      if (t.includes(qt) || qt.includes(t)) {
        matchCount += 1;
        break;
      }
    }
  }
  return queryTokens.length > 0 ? matchCount / queryTokens.length : 0;
}

function searchFAQs(query, limit = 3) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const rows = db.prepare(
    'SELECT id, category, question, answer, keywords FROM faqs WHERE enabled = 1'
  ).all();

  const scored = rows.map(faq => {
    const questionScore = score(faq.question, queryTokens);
    const answerScore   = score(faq.answer, queryTokens);
    const keywordScore  = score(faq.keywords || '', queryTokens);
    const total = questionScore * 0.5 + answerScore * 0.3 + keywordScore * 0.2;
    return { ...faq, score: total };
  });

  return scored
    .filter(f => f.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getAnswer(query) {
  const results = searchFAQs(query, 1);
  if (results.length === 0) return { found: false, answer: null, faq: null };
  return { found: true, answer: results[0].answer, faq: results[0] };
}

module.exports = { searchFAQs, getAnswer, tokenize, score };
