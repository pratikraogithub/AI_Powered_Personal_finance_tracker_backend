import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const FloatingChat = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

    const toggleChat = () => setOpen(!open);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userInput = input;
        setMessages((prev) => [...prev, { role: "user", text: userInput }]);
        setInput("");

        // Add AI placeholder
        const typingIndex = messages.length + 1;
        setMessages((prev) => [...prev, { role: "ai", text: "" }]);

        const token = localStorage.getItem("access");
        if (!token) {
            setMessages((prev) => {
                const updated = [...prev];
                updated[typingIndex] = { role: "ai", text: "Error: User not authenticated. Please log in." };
                return updated;
            });
            return;
        }

        try {
            const res = await axios.post(
                `${BACKEND_URL}/api/ai-assistant/`,
                { query: userInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const fullResponse = res.data?.response || "No response";

            // Typewriter effect
            let currentText = "";
            const interval = 20; // ms per character
            for (let i = 0; i < fullResponse.length; i++) {
                await new Promise((r) => setTimeout(r, interval));
                currentText += fullResponse[i];
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[typingIndex] = { role: "ai", text: currentText };
                    return updated;
                });
            }
        } catch (err) {
            setMessages((prev) => {
                const updated = [...prev];
                updated[typingIndex] = { role: "ai", text: "Error: Could not reach AI assistant" };
                return updated;
            });
            console.error(err);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
            <button
                className="btn btn-primary rounded-circle"
                style={{ width: "60px", height: "60px" }}
                onClick={toggleChat}
            >
                {open ? "×" : "💬"}
            </button>

            {open && (
                <div
                    className="card shadow"
                    style={{ width: "300px", height: "400px", display: "flex", flexDirection: "column", marginTop: "10px" }}
                >
                    <div className="card-header bg-primary text-white" style={{ fontWeight: "bold" }}>
                        AI Finance Assistant
                    </div>

                    <div
                        className="card-body"
                        style={{ flex: 1, overflowY: "auto", padding: "10px" }}
                        ref={scrollRef}
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    textAlign: msg.role === "user" ? "right" : "left",
                                    marginBottom: "8px",
                                }}
                            >
                                <span
                                    className={`badge ${msg.role === "user" ? "bg-secondary" : "bg-success"}`}
                                    style={{
                                        fontSize: "0.9em",
                                        whiteSpace: "pre-wrap",
                                        wordWrap: "break-word",
                                        display: "inline-block",
                                        maxWidth: "100%",
                                        padding: "5px 8px",
                                    }}
                                >
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="card-footer d-flex">
                        <input
                            type="text"
                            className="form-control me-2"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me..."
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button className="btn btn-primary" onClick={handleSend}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingChat;
