
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const LOCAL_API = "http://localhost:5001";
const host = window.location.hostname;
const isLocalHost = host === "localhost" || host === "127.0.0.1";

if (!isLocalHost) {
  const origin = window.location.origin;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith(LOCAL_API)) {
      return originalFetch(`${origin}${input.slice(LOCAL_API.length)}`, init);
    }

    if (input instanceof Request && input.url.startsWith(LOCAL_API)) {
      return originalFetch(
        new Request(`${origin}${input.url.slice(LOCAL_API.length)}`, input),
        init
      );
    }

    return originalFetch(input, init);
  };
}

const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
const query = new URLSearchParams(window.location.search);
const oauthToken = hash.get("token") || query.get("token");
if (oauthToken) {
  localStorage.setItem("token", oauthToken);
  window.location.replace("/dashboard");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);