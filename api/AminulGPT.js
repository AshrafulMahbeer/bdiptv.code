// Serverless function (Node.js) without external dependencies

// Function to fetch the answer library and process it (using fetch built into the platform like Vercel or AWS Lambda)
async function getAnswerLibrary() {
  const response = await fetch('https://bosta-live.vercel.app/static/database.txt');
  const text = await response.text();
  return text.split('\n').filter(line => line.trim() !== '');  // Split the text into lines and remove empty ones
}

// Function to match the question to the closest answer.
function findAnswer(library, question) {
  const questionKey = '#AIINF-QUE-';  // Key identifier for the question

  let matchedAnswers = [];

  // Iterate through the library to find the closest match
  for (let i = 0; i < library.length; i++) {
    const line = library[i];
    
    if (line.includes(questionKey)) {
      const questionText = line.split(questionKey)[1].trim();

      if (questionText.toLowerCase().includes(question.toLowerCase())) {
        // If we have multiple answers for this question, collect them
        let answer = library[i + 1];
        while (answer && answer.includes('#AIINF-ANS-')) {
          matchedAnswers.push(answer.split('#AIINF-ANS-')[1].trim());
          answer = library[i + 2];  // Move to the next answer
          i++; // Increment to check the next answer
        }
      }
    }
  }

  // If no matches, return extra answer
  if (matchedAnswers.length === 0) {
    return "Extra ans";
  }

  // If multiple answers, return a random one
  return matchedAnswers[Math.floor(Math.random() * matchedAnswers.length)];
}

module.exports = async (req, res) => {
  const question = req.query.text;  // Get the question from query params
  if (!question) {
    return res.status(400).json({ error: "Question parameter 'text' is required." });
  }

  // Fetch the answer library
  const library = await getAnswerLibrary();

  // Find the closest matching answer
  const answer = findAnswer(library, question);

  // Return the matched answer in the required format
  return res.status(200).json({ answer: answer });
};
