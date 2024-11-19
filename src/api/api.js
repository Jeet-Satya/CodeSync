import axios from "axios"; // Import the axios library for making HTTP requests
import { LANGUAGE_VERSIONS } from "../constants/constants"; // Import LANGUAGE_VERSIONS from constants, which likely maps programming languages to their versions

// Create an instance of axios with a pre-configured baseURL for the Piston API
const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston", // Base URL for the Piston API, used for code execution
});

// Define an asynchronous function to execute code in a given language
export const executeCode = async (language, sourceCode) => {
  // Send a POST request to the /execute endpoint of the Piston API
  const response = await API.post("/execute", {
    language: language, // Specify the programming language
    version: LANGUAGE_VERSIONS[language], // Specify the version of the language using the imported LANGUAGE_VERSIONS constant
    files: [
      {
        content: sourceCode, // Provide the source code to be executed
      },
    ],
  });
  return response.data; // Return the response data from the API, which should include the result of the code execution
};
