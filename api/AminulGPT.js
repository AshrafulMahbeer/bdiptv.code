// This is a basic Node.js example, you can deploy this on platforms like Vercel, AWS Lambda, or Google Cloud Functions.

const fetch = require('node-fetch');  // for fetching the library

// Function to fetch the answer library and process it.
async function getAnswerLibrary() {
    const response = await fetch('https://bosta-live.vercel.app/static/database.txt');
    const text = await response.text();
    return text.split('\n').filter(line => line.trim() !== '');  // Split the text into lines and remove empty ones
}

// Function to match the question to the closest answer.
function findAnswer(library, question) {
    const questionKey = `#AIINF-QUE-`;  // Key identifier for the question

    // Look for the question that has the closest match
    let matchedQuestion = '';
    let matchedAnswers = [];
    
    // Iterate through the library to find the closest match
    library.forEach((line, index) => {
        if (line.includes(questionKey)) {
            const questionText = line.split(questionKey)[1].trim();
            if (questionText.toLowerCase().includes(question.toLowerCase())) {
                matchedQuestion = questionText;
                
                // If we have multiple answers for this question, collect them
                let answer = library[index + 1];
                while (answer && answer.includes('#AIINF-ANS-')) {
                    matchedAnswers.push(answer.split('#AIINF-ANS-')[1].trim());
                    answer = library[index + 2];  // Move to the next line
                    index++; // Increment to check next answer
                }
            }
        }
    });
    
    if (matchedAnswers.length === 0) {
        return "Extra ans";  // Return the fallback answer if no match found
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

    // Return the matched answer as JSON
    return res.status(200).json({ answer });
};
