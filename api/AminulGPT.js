export default async function handler(req, res) {
  try {
    const { text: question } = req.query;

    if (!question) {
      return res.status(400).json({ error: "Missing 'text' parameter in query." });
    }

    // URL of the remote database file
    const databaseUrl = "https://bosta-live.vercel.app/static/database.txt";

    // Fetch the database file content
    const response = await fetch(databaseUrl);
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch the database file." });
    }
    const library = await response.text();

    // Helper function to normalize text (remove excess spaces, convert to lowercase)
    function normalizeText(text) {
      return text.replace(/\s+/g, " ").trim().toLowerCase();
    }

    // Normalize question and library content
    const normalizedQuestion = normalizeText(question);
    const normalizedLibrary = normalizeText(library);

    // Helper function to find the closest matching question
    function findClosestMatch(question, library) {
      const questionRegex = /#aiinf-que-\d+\s*:\s*(.+?);/g;
      let match;
      const questions = [];
      while ((match = questionRegex.exec(library)) !== null) {
        questions.push(match[1]);
      }

      if (questions.length === 0) return null;

      let closestMatch = null;
      let highestSimilarity = 0;

      for (const q of questions) {
        const similarity = calculateSimilarity(question, q);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          closestMatch = q;
        }
      }

      return highestSimilarity > 0 ? closestMatch : null;
    }

    // Helper function to calculate string similarity
    function calculateSimilarity(a, b) {
      let matches = 0;
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] === b[i]) matches++;
      }
      return matches / Math.max(a.length, b.length);
    }

    // Helper function to extract answers
    function extractAnswers(library, question) {
      const questionRegex = new RegExp(`#aiinf-que-\\d+\\s*:\\s*${question}\\s*;`);
      const match = library.match(questionRegex);

      if (!match) {
        const extraAnswerMatch = library.match(/#aiinf-ext\s*:\s*(.+?);/);
        return extraAnswerMatch ? [extraAnswerMatch[1]] : [];
      }

      const questionNumberMatch = match[0].match(/#aiinf-que-(\d+)\s*:/);
      const questionNumber = questionNumberMatch ? questionNumberMatch[1] : null;
      if (!questionNumber) return [];

      const answersRegex = new RegExp(`#aiinf-ans-${questionNumber}\\s*:\\s*(.+?);`, "g");
      const answers = [];
      let answerMatch;

      while ((answerMatch = answersRegex.exec(library)) !== null) {
        answers.push(answerMatch[1]);
      }

      return answers;
    }

    // Match the closest question and extract answers
    const closestQuestion = findClosestMatch(normalizedQuestion, normalizedLibrary);
    const answers = extractAnswers(normalizedLibrary, closestQuestion || "");

    if (answers.length === 0) {
      return res.status(404).json({ error: "No answer found." });
    }

    // Randomly select one answer
    const selectedAnswer = answers[Math.floor(Math.random() * answers.length)];

    return res.status(200).json({ id: Math.random().toString(36).substring(7), answer: selectedAnswer });
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
