import React, { useState } from "react";
import api from "../api/axios";

function AIAssistantChat() {
    const [messages, setMessages] = useState([
        { sender: "ai", text: "Hi 👋 I’m your AI Finance Assistant. How can I help you today?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!input.trim()) return;

        const currentInput = input;

        const userMessage = {
            sender: "user",
            text: currentInput,
        };

        setMessages((prev) => [...prev, userMessage]);

        setInput("");
        setLoading(true);

        try {

            const res = await api.post("/api/ai-assistant/", {
                query: currentInput,
            });

            console.log("API RESPONSE:", res.data);

            const botText =
                res.data?.response ||
                "No response";

            const aiMessage = {
                sender: "ai",
                text: botText,
            };

            setMessages((prev) => [...prev, aiMessage]);

        } catch (error) {

            console.error(error);

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "⚠️ Sorry, I couldn’t process your request.",
                },
            ]);

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="container py-5 d-flex justify-content-center">
            <div className="card shadow-lg w-100" style={{ maxWidth: "700px", minHeight: "80vh" }}>
                <div className="card-header bg-primary text-white text-center">
                    <h4>💬 AI Finance Assistant</h4>
                </div>

                <div
                    className="card-body overflow-auto"
                    style={{ height: "65vh", backgroundColor: "#f9f9f9" }}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`d-flex mb-3 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"
                                }`}
                        >
                            <div
                                className={`p-3 rounded-4 ${msg.sender === "user"
                                    ? "bg-primary text-white"
                                    : "bg-light border text-dark"
                                    }`}
                                style={{ maxWidth: "75%" }}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {loading && <p className="text-center text-muted">💭 AI is thinking...</p>}
                </div>

                <div className="card-footer">
                    <form className="d-flex" onSubmit={sendMessage}>
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Ask about your finances..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button className="btn btn-primary" disabled={loading}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AIAssistantChat;
