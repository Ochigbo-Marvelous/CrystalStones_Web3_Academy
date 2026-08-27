const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

// Basic Crystal Stones knowledge (static)
const CRYSTAL_STONES_KNOWLEDGE = [
  {
    title: "What is Crystal Stones?",
    content:
      "Crystal Stones is a Real World Asset (RWA) cryptocurrency project powered by its native token. It is built on a deflationary model on BNB Smart Chain and is backed by tangible physical assets, primarily solid minerals, with additional exposure to real estate and petroleum.",
  },
  {
    title: "Crystal Stones Token Contract",
    content:
      "The official Crystal Stones BEP-20 contract address on BNB Smart Chain is 0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00.",
  },
  {
    title: "Tokenomics",
    content:
      "Crystal Stones has a total supply of 135,000,000 tokens with a circulating supply of about 104,100,000. It features a deflationary model with burns on transactions.",
  },
];

const askMentor = async (userId, question) => {
  if (!question || question.trim().length < 3) {
    throw new ApiError(400, "Please ask a proper question");
  }

  const lowerQuestion = question.toLowerCase();

  // 1. Search in lessons (dynamic knowledge base)
  const [lessons] = await pool.query(
    `SELECT l.title, l.content, m.title as module_title, c.title as course_title
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.content IS NOT NULL AND l.content != ''`
  );

  let bestMatch = null;
  let highestScore = 0;

  // Simple keyword matching (can be improved later with better search)
  for (const lesson of lessons) {
    const content = (lesson.content || "").toLowerCase();
    const title = (lesson.title || "").toLowerCase();

    let score = 0;
    const words = lowerQuestion.split(/\s+/).filter((w) => w.length > 3);

    for (const word of words) {
      if (title.includes(word)) score += 3;
      if (content.includes(word)) score += 1;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = lesson;
    }
  }

  // 2. Search static Crystal Stones knowledge
  for (const item of CRYSTAL_STONES_KNOWLEDGE) {
    const content = item.content.toLowerCase();
    const title = item.title.toLowerCase();

    let score = 0;
    const words = lowerQuestion.split(/\s+/).filter((w) => w.length > 3);

    for (const word of words) {
      if (title.includes(word)) score += 4;
      if (content.includes(word)) score += 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        title: item.title,
        content: item.content,
        course_title: "Crystal Stones Knowledge",
        module_title: "Official Information",
      };
    }
  }

  // 3. Generate response
  let answer;

  if (bestMatch && highestScore > 0) {
    answer = {
      found: true,
      source: {
        course: bestMatch.course_title,
        module: bestMatch.module_title,
        lesson: bestMatch.title,
      },
      answer: bestMatch.content,
      confidence: highestScore,
    };
  } else {
    answer = {
      found: false,
      answer:
        "I couldn't find specific information about that in the current course materials. Please try asking about topics covered in your enrolled courses, or ask about Crystal Stones token, tokenomics, or real-world assets.",
      confidence: 0,
    };
  }

  // Optional: Save chat history later if needed
  return answer;
};

module.exports = {
  askMentor,
};