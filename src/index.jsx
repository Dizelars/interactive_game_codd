import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style/default/base.css";
import "./style/default/fonts.css";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
