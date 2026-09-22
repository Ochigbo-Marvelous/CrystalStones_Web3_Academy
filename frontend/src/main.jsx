import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const LOCAL_API = "http://localhost:5001";
const host = window.location.hostname;
const isLocalHost = host === "localhost" || host === "127.0.0.1";
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  const token = localStorage.getItem("token");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let nextInput = input;
  if (!isLocalHost) {
    if (typeof input === "string" && input.startsWith(LOCAL_API)) {
      nextInput = `${window.location.origin}${input.slice(LOCAL_API.length)}`;
    } else if (input instanceof Request && input.url.startsWith(LOCAL_API)) {
      nextInput = new Request(
        `${window.location.origin}${input.url.slice(LOCAL_API.length)}`,
        input
      );
    }
  }

  return originalFetch(nextInput, { ...init, headers, credentials: "include" });
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);