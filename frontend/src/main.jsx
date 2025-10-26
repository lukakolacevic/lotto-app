import React, { useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [health, setHealth] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [nums, setNums] = useState("1,2,3,4,5,6");

  const check = async () => {
    const res = await fetch("/api/health");
    const data = await res.json();
    setHealth(JSON.stringify(data, null, 2));
  };

  const submitTicket = async () => {
    const numbers = nums
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isInteger(n));
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idNumber, numbers }),
    });
    const text = await res.text();
    try {
      alert("Response:\n" + JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      alert("Non-JSON response:\n" + text);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "32px auto", fontFamily: "system-ui" }}>
      <h1>Lotto App</h1>

      <button onClick={check}>Check backend</button>
      <pre>{health}</pre>

      <h2>Submit ticket</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="ID number (1–20 chars)" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
        <input placeholder="Numbers (comma-separated)" value={nums} onChange={e => setNums(e.target.value)} />
        <button onClick={submitTicket}>Send ticket</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
