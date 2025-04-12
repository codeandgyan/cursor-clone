import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import readline from "readline";
import { tools } from "./tools.js";
dotenv.config();

console.log(process.env.GOOGLE_API_KEY);

const genAi = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const prompt = `
You are a helpful assistant who can answer coding questions.

You have access to a set of tools that can help you answer the question.
You should operate in following states: USER, PLAN, ACTION, OBSERVATION, OUTPUT

USER - Wait for the user to provide a question.
PLAN - Print the plan. It might involve deciding to use a tool or not.
ACTION - Take the action decided in PLAN state. This might involve calling a tool.
OBSERVATION - Wait for the OBSERVATION of the result of the action.
OUTPUT - Output the result based on your observation of the action and the question.

Your response in each step should be strictly in JSON format.
Tools provided to you:
- executeCommand: Execute a command in the system. 
    - Takes the input as a command in string format.
    - If I use a windows machine, you should use windows commands.

Here's an example of the complete steps:

{"type": "user", "prompt": "Generate a simple hello world program in NodeJS"}

{"type": "plan", "plan": "I need to create a new folder by calling executeCommand tool"}
{"type": "action", "function": "executeCommand", "input": "mkdir <appropriate-folder-name>"}
{"type": "observation", "observation": "'mkdir <appropriate-folder-name>' Command executed successfully"}

{"type": "plan", "plan": "I need to navigate to the newly created folder by calling executeCommand tool"}
{"type": "action", "function": "executeCommand", "input": "cd ./<appropriate-folder-name>"}
{"type": "observation", "observation": "'cd ./<appropriate-folder-name>' Command executed successfully"}

{"type": "plan", "plan": "I need to run a command 'pnpm init -y' by calling executeCommand tool"}
{"type": "action", "function": "executeCommand", "input": "pnpm init -y"}
{"type": "observation", "observation": "'pnpm init -y' Command executed successfully"}

{"type": "plan", "plan": "I need to create a new file 'index.js' by calling executeCommand tool"}
{"type": "action", "function": "executeCommand", "input": "touch index.js"}
{"type": "observation", "observation": "'touch index.js' Command executed successfully"}

{"type": "plan", "plan": "I need to write 'console.log('Hello, World!');' in the 'index.js' file by calling executeCommand tool"}
{"type": "action", "function": "executeCommand", "input": 'echo "console.log("Hello, World!");" > index.js'}
{"type": "observation", "observation": "'echo "console.log("Hello, World!");" > index.js' Command executed successfully"}

{"type": "output", "output": "Boom! Your Hello World program is ready. Happy coding 🧑‍💻!"}

The UserMessage incremental steps, one step keeps adding at a time.
You are supposed to return only the next immediate step in JSON format.
Always wait for UserMessage before returning the next step.

Message example # 1:
If the UserMessage is: 
[
    {"type": "user", "prompt": "Generate a simple hello world program in NodeJS"}
]
Then your Response should be: 
{"type": "plan", "plan": "I need to run a command 'pnpm init -y' by calling executeCommand tool"}

Next, if the UserMessage is:
[
    {"type": "user", "prompt": "Generate a simple hello world program in NodeJS"},
    {"type": "plan", "plan": "I need to run a command 'pnpm init -y' by calling executeCommand tool"}
]

Then your Response should be:
{"type": "user", "prompt": "Generate a simple hello world program in NodeJS"}

Do not return "plan" and "action" both in the same step.
And so on...
`;

const model = await genAi.getGenerativeModel({
  model: "gemini-2.0-flash",
  generateConfig: {
    responseMimeType: "application/json",
  },
  systemInstruction: prompt,
});

const input = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion() {
  input.question("Ask me anything (type 'exit' to quit): ", async (message) => {
    if (message.toLowerCase() === "exit") {
      console.log("Goodbye!");
      input.close();
      return;
    }

    // Process the input
    const messages = [];

    const userMessage = {
      type: "user",
      prompt: message,
    };
    messages.push(JSON.stringify(userMessage));

    while (true) {
      try {
        const result = await model.generateContent(messages);
        const response = result.response.text();
        console.log(response);
        messages.push(response);
        const step = JSON.parse(response);

        if (step.type === "action") {
          const result = await tools[step.function].fn(step.input);
          messages.push(
            JSON.stringify({ type: "observation", observation: result })
          );
          continue;
        }

        if (step.type === "output") {
          break;
        }
      } catch (error) {
        console.log("Error: ", error);
        break;
      }
    }

    // Ask for next input
    askQuestion();
  });
}

// Start the first question
askQuestion();
