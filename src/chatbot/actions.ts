"use server";

import nlp from "compromise";
import Fuse from "fuse.js";
import data from "./data.json";

export async function getChatbotResponse(userInput: string): Promise<string> {
  try {
    // 1. Clean user input (Regex replacement for Natural)
    // We use regex to break down the sentence and remove noise, avoiding 'webworker-threads' build issues
    const tokens = userInput.split(/\W+/).filter(Boolean);
    const cleanInput = tokens.join(" ");

    // 2. Extract keywords (Compromise)
    // We use Compromise to remove stop words and keep relevant terms
    const doc = nlp(cleanInput);
    const keywords = doc.terms().match('!#StopWord').out('array');
    
    // If keywords are found, use them; otherwise fallback to cleaned input
    const query = keywords.length > 0 ? keywords.join(" ") : cleanInput;

    // 3. Find best FAQ (Fuse.js)
    const fuse = new Fuse(data, {
      keys: ["question", "answer"],
      includeScore: true,
      threshold: 0.4, // Lowered to reduce false positives
      ignoreLocation: true,
      minMatchCharLength: 3,
    });

    const results = fuse.search(query);

    // 4. Return answer (JSON)
    if (results.length > 0) {
      return results[0].item.answer;
    }

    return "I'm sorry, I couldn't find specific information on that. Could you try rephrasing your question?";
  } catch (error) {
    console.error("Chatbot error:", error);
    return "I'm having a little trouble thinking right now. Please try again later.";
  }
}
