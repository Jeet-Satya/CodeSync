import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror'; // Import CodeMirror library
import 'codemirror/lib/codemirror.css'; // Import CodeMirror's base CSS
import 'codemirror/theme/dracula.css'; // Import the Dracula theme for CodeMirror
import 'codemirror/mode/javascript/javascript'; // Import JavaScript mode for syntax highlighting
import 'codemirror/addon/edit/closetag'; // Import addon for auto-closing HTML tags
import 'codemirror/addon/edit/closebrackets'; // Import addon for auto-closing brackets
import ACTIONS from '../Actions'; // Import custom actions for socket events
import Output from '../pages/Output'; // Import Output component
import { CODE_SNIPPETS } from "../constants/constants"; // Import predefined code snippets from constants
import LanguageSelector from "../language/LanguageSelector"; //

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null); // Create a ref to store the CodeMirror editor instance
    const [value, setValue] = useState(""); // useState hook to manage the current code in the editor
    const [language, setLanguage] = useState("javascript"); // useState hook to manage the current programming language

    const onMount = (editor) => {
        editorRef.current = editor; // Store the editor instance in the ref
        editor.focus(); // Set focus to the editor
    };

    

    useEffect(() => {
        async function init() {
            // Initialize the CodeMirror editor with the provided configurations
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'), // Bind CodeMirror to the textarea element
                {
                    mode: { name: language, json: true }, // Set the language mode (dynamic based on state)
                    theme: 'dracula', // Set the theme to Dracula
                    autoCloseTags: true, // Enable auto-closing of HTML tags
                    autoCloseBrackets: true, // Enable auto-closing of brackets
                    lineNumbers: true, // Display line numbers in the editor
                }
            );

            // Event listener for changes in the editor
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes; // Destructure origin from the changes object
                const code = instance.getValue(); // Get the current code from the editor
                onCodeChange(code); // Trigger the onCodeChange callback with the updated code

                // If the change was not caused by setting the value programmatically
                if (origin !== 'setValue') {
                    // Emit the code change event to the server via socket
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId, // Pass the current room ID
                        code, // Pass the updated code
                    });
                }
            });
        }
        init(); // Call the init function to initialize CodeMirror
    }, [language]); // Re-run this effect when language changes

    useEffect(() => {
        if (socketRef.current) {
            // Listen for CODE_CHANGE events from the server
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code); // Update the editor with the new code
                }
            });
        }

        // Clean up the event listener when the component unmounts
        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]); // Re-run this effect if socketRef.current changes

    return (
        <div>
           

            {/* Render the textarea element that will be replaced by CodeMirror */}
            <textarea id="realtimeEditor" defaultValue={CODE_SNIPPETS[language]} />

            {/* Render the Output component with current editor reference and language */}
            <Output editorRef={editorRef} language={language} />
        </div>
    );
};

export default Editor; // Export the Editor component
