import { exec } from "child_process";

// const executeCommand = async (command) => {
//   const result = await exec(command);
//   const output = result.stdout.toString();
//   console.log(`> ${output}`);
//   return `${command} executed successfully`;
// };

const executeCommand = async (command) => {
  return new Promise((resolve, reject) => {
    const cmd = command.replace(/\\/g, "");
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`Command output: ${stdout}`);

      resolve(`${command} executed successfully with output: ${stdout}`);
    });
  });
};

export const tools = {
  executeCommand: {
    fn: executeCommand,
  },
};
