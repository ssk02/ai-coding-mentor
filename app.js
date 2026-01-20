const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cors());
app.use(express.json());

/*app.get("/", (req, res) => {
    res.send("AI Coding Mentor API running");
});*/

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/history", require("./routes/history.routes"));
app.use("/", require("./routes/view.routes"));

module.exports = app;