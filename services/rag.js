const db = require('../database/db');

const STOP_WORDS = new Set([
  'que', 'es', 'de', 'en', 'la', 'el', 'los', 'las', 'un', 'una',
  'y', 'e', 'o', 'a', 'con', 'por', 'para', 'del', 'al', 'su',
  'se', 'no', 'lo', 'le', 'como', 'más', 'pero', 'sus', 'este',
  'entre', 'todo', 'también', 'fue', 'era', 'son', 'han', 'hay',
  'cómo', 'qué', 'cuál', 'quién', 'dónde', 'cuándo', 'porque',
  'puede', 'ser', 'sí', 'ya', 'solo', 'vez', 'dos', 'muy',
]);

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text) {
  if (!text) return [];
  const cleaned = normalize(text)
    .replace(/[¿?¡!,;.:()\-¿¡<>"'/[\]{}|`~@#$%^&*_=+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function score(text, queryTokens) {
  const tokens = tokenize(text);
  if (tokens.length === 0 || queryTokens.length === 0) return 0;
  let matchCount = 0;
  for (const qt of queryTokens) {
    for (const t of tokens) {
      if (t === qt) {
        matchCount += 1;
        break;
      }
    }
  }
  return matchCount / queryTokens.length;
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
    const total = questionScore * 0.5 + answerScore * 0.28 + keywordScore * 0.22;
    return { ...faq, score: Math.round(total * 100) / 100 };
  });

  return scored
    .filter(f => f.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getAnswer(query) {
  const results = searchFAQs(query, 1);
  if (results.length === 0) return { found: false, answer: null, faq: null };
  return { found: true, answer: results[0].answer, faq: results[0] };
}

module.exports = { searchFAQs, getAnswer, tokenize, score };
