import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registers the service worker that caches the app shell + datasets so
// address lookups, neighborhood context, and the citywide comparison
// still work with no connection. The letter generator intentionally
// still requires a live network call — see public/sw.js.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* fine if this fails — app still works online, just without offline caching */
    });
  });
}
