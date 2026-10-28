import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import store from "./store/store.js";
import { Provider } from "react-redux";

// Keep the app sized to the visible viewport. Android resizes the layout for
// the keyboard (see interactive-widget in index.html); iOS only shrinks the
// visual viewport, so track it here.
const vv = window.visualViewport;
if (vv) {
   const fit = () => {
      if (vv.scale > 1.01) return; // pinch-zoomed: leave the layout alone
      document.documentElement.style.setProperty("--app-height", `${vv.height}px`);
      window.scrollTo(0, 0);
   };
   vv.addEventListener("resize", fit);
   fit();
}

ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <Provider store={store}>
         <App />
      </Provider>
   </React.StrictMode>
);
