import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importing toast for notifications
import ACTIONS from '../Actions'; // Importing custom actions for socket events
import Client from '../components/Client'; // Importing Client component
import Editor from '../components/Editor'; // Importing Editor component
import { initSocket } from '../socket'; // Importing function to initialize socket
import Output from './Output';
import { CODE_SNIPPETS } from "../constants/constants";
import LanguageSelector from "../language/LanguageSelector"; // Importing LanguageSelector component

import { Box } from "@chakra-ui/react";
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom'; // Importing React Router hooks for navigation and URL parameters

const EditorPage = () => {
    const socketRef = useRef(null); // Creating a ref to store the socket instance
    const codeRef = useRef(null); // Creating a ref to store the current code
    const location = useLocation(); // Hook to get current location (state, pathname, etc.)
    const { roomId } = useParams(); // Hook to get roomId from the URL parameters
    const reactNavigator = useNavigate(); // Hook to programmatically navigate to different routes
    const [clients, setClients] = useState([]); // State to store the list of connected clients
    const editorRef = useRef(); // Create a reference to the editor instance
    const [value, setValue] = useState(""); // useState hook to manage the current code in the editor
    const [language, setLanguage] = useState("javascript"); // useState hook to manage the current programming language

    useEffect(() => {
        const init = async () => {
            // Initialize socket connection
            socketRef.current = await initSocket();
            // Handle socket connection errors
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.'); // Show error toast
                reactNavigator('/'); // Navigate back to the home page
            }

            // Emit the JOIN event to the server with roomId and username
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username, // Get username from location state
            });

            // Listen for the JOINED event from the server
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`); // Show success toast when another user joins
                        console.log(`${username} joined`);
                    }
                    setClients(clients); // Update the clients list
                    // Sync the code with the newly joined client
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current, // Send current code
                        socketId, // Send the socket ID of the newly joined client
                    });
                }
            );

            // Listen for the DISCONNECTED event from the server
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`); // Show success toast when a user leaves
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId // Remove the disconnected client from the list
                        );
                    });
                }
            );
        };
        init(); // Call the init function to set up the socket connection and event listeners

        // Clean up function to disconnect the socket and remove event listeners
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []); // Empty dependency array means this useEffect runs only once when the component mounts

    // Function to copy the room ID to the clipboard
    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId); // Write roomId to clipboard
            toast.success('Room ID has been copied to your clipboard'); // Show success toast
        } catch (err) {
            toast.error('Could not copy the Room ID'); // Show error toast
            console.error(err);
        }
    }

    // Function to leave the room and navigate back to the home page
    function leaveRoom() {
        reactNavigator('/'); // Navigate to the home page
    }

    const onSelect = (language) => {
        setLanguage(language); // Update the selected language state
        const snippet = CODE_SNIPPETS[language] || ""; // Load the corresponding code snippet or empty string if not found
        setValue(snippet); // Update the editor value with the selected language snippet
        if (editorRef.current) {
            editorRef.current.setValue(snippet); // Update CodeMirror with the selected language snippet
        }
    };

    // If no username is found in location state, navigate back to home page
    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="flex h-screen">
            <aside className="w-1/5 bg-gray-800 text-white flex flex-col justify-between p-4">
                <div>
                    <div className="logo mb-4">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <h3 className="text-lg font-bold">Connected</h3>
                    <div className="clientsList mt-4">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId} // Unique key for each client
                                username={client.username} // Pass username as prop to Client component
                            />
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-start">
                    <button 
                        className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg 
                        shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 
                        transition duration-300 mb-2" 
                        onClick={copyRoomId}
                    >
                        Copy ROOM ID
                    </button>
                    <button 
                        className="w-full py-2 px-4 bg-red-500 text-white font-semibold 
                        rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2
                        focus:ring-red-400 transition duration-300" 
                        onClick={leaveRoom}
                    >
                        Leave
                    </button>
                </div>
            </aside>
            <main className="w-4/5 flex flex-col p-0 m-0"> {/* Ensure full width and no margins */}
                <div className="relative flex-1"> {/* Ensure it fills available space */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <LanguageSelector language={language} onSelect={onSelect} />
                    </div>
                    <Box flex="1" mt={12} p={0}> {/* Ensure Box takes all available space */}
                        <Editor
                            socketRef={socketRef} // Pass socketRef as prop to Editor component
                            roomId={roomId} // Pass roomId as prop to Editor component
                            onCodeChange={(code) => {
                                codeRef.current = code; // Update codeRef when code changes
                            }}
                            ref={editorRef} // Attach ref to Editor for direct manipulation
                            value={value} // Pass current value to Editor
                        />
                    </Box>
                </div>
            </main>
        </div>
    );
};

export default EditorPage; // Export EditorPage component
