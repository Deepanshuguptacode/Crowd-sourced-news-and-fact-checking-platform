# Gemini Tool Calling + Vector DB (Fact-Checking)

This is a highly simplified, easy-to-remember example tailored for your **Crowd-sourced News and Fact-Checking Platform**. It demonstrates how **Gemini** can intelligently call a **Vector Database (Pinecone)** tool to search for similar past verified news and fact-check a claim.

## The Code

```javascript
// 1. Import required libraries
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// 2. Initialize Clients
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_KEY");
const pinecone = new Pinecone({ apiKey: "YOUR_PINECONE_KEY" });

// 3. Define the Tool (Schema) so Gemini knows it exists
const factCheckTool = {
  functionDeclarations: [{
    name: "searchVerifiedNews",
    description: "Search vector database for verified news to fact-check a claim",
    parameters: {
      type: "OBJECT",
      properties: { claim: { type: "STRING" } },
      required: ["claim"]
    }
  }]
};

// 4. The actual function that executes Vector DB Search
async function searchVerifiedNews(claim) {
  const index = pinecone.Index("news-facts");
  // (In reality, you'd convert the claim to an embedding vector first)
  const queryResult = await index.query({ vector: [0.1, 0.2, 0.3], topK: 1, includeMetadata: true });
  return { verifiedSource: queryResult.matches[0].metadata.title };
}

// 5. Main Logic: Link Gemini with the Tool
async function analyzeNews(claimText) {
  // Pass the tool to the Gemini model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", tools: [factCheckTool] });
  const chat = model.startChat();
  
  // Ask Gemini to verify the news
  let response = await chat.sendMessage(`Verify this news: ${claimText}`);
  const functionCall = response.response.functionCalls()[0];

  // If Gemini decides to use our tool
  if (functionCall && functionCall.name === "searchVerifiedNews") {
    // Execute the vector DB search using Gemini's extracted arguments
    const dbResult = await searchVerifiedNews(functionCall.args.claim);
    
    // Send Vector DB result back to Gemini to generate the final human-readable answer
    response = await chat.sendMessage([{
      functionResponse: { name: "searchVerifiedNews", response: dbResult }
    }]);
  }
  
  console.log(response.response.text());
}

// Run the script
analyzeNews("The moon is made of cheese");
```

---

## Line-by-Line Explanation

### 1. Imports
* `import { GoogleGenerativeAI } ...`: Imports the official SDK to interact with Gemini LLM.
* `import { Pinecone } ...`: Imports the Pinecone SDK, which acts as our Vector Database for storing/searching news embeddings.

### 2. Initialization
* `const genAI = ...`: Initializes the Gemini client with your API key.
* `const pinecone = ...`: Initializes the Pinecone client with your API key so you can connect to your databases.

### 3. Tool Definition
* `const factCheckTool = ...`: We define a JSON schema that describes our tool. Gemini uses this to understand *what* the tool does and *what arguments* it requires.
* `name: "searchVerifiedNews"`: The unique identifier for the function.
* `description: ...`: Crucial for Gemini. The LLM reads this description to decide *when* it should trigger this tool.
* `parameters: ...`: Defines that Gemini must provide a `claim` (String) when calling this tool.

### 4. Vector DB Function execution
* `async function searchVerifiedNews(claim)`: This is the actual JavaScript function that does the heavy lifting when Gemini asks for it.
* `const index = pinecone.Index("news-facts")`: Connects to a specific Pinecone index (database table equivalent) where verified news embeddings are stored.
* `const queryResult = await index.query(...)`: Performs a similarity search. (Note: for simplicity, a dummy vector `[0.1, 0.2...]` is shown, but in reality, you'd pass the `claim` through an embedding model first).
* `return { verifiedSource: ... }`: Returns the metadata (e.g., the title of the matched real news article).

### 5. Main Execution Flow
* `genAI.getGenerativeModel({ ..., tools: [factCheckTool] })`: Instantiates the Gemini 1.5 Pro model and explicitly equips it with our `factCheckTool`.
* `const chat = model.startChat()`: Starts an interactive chat session so context is maintained between tool requests and responses.
* `await chat.sendMessage(...)`: We ask Gemini our initial prompt to verify the claim.
* `const functionCall = response.response.functionCalls()[0]`: We check if Gemini responded with a request to run a function instead of standard text.
* `if (functionCall && functionCall.name === "searchVerifiedNews")`: Validates that Gemini wants to run our specific Vector DB tool.
* `const dbResult = await searchVerifiedNews(functionCall.args.claim)`: We execute our local function using the exact arguments (the claim text) that Gemini cleverly extracted from our prompt.
* `response = await chat.sendMessage([{ functionResponse: ... }])`: We send the raw results from the Vector DB *back* to Gemini. Gemini then reads this context and generates a final conversational answer (e.g., "Based on my search, this is fake news because...").
* `console.log(...)`: Outputs Gemini's final synthesized fact-check verdict.
