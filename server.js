const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");  
const path = require("path");
const { sql, pool, poolConnect } = require("./database");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());


app.use(session({
    secret: "gatepass-secret",
    resave: false,
    saveUninitialized: true
}));


// ✅ Check Auth API
app.get("/api/check-auth", (req, res) => {
    if (req.session && req.session.user) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});
// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));
// Routes
app.get("/", (req, res) => {
    res.send("Backend Connected Successfully");
});

app.get("/track", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "track.html"));
});

app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/create", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "create.html"));
});

app.get("/review", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "review.html"));
});

app.get("/review-edit", (req, res) => {
    res.sendFile(__dirname + "/public/review-edit.html");
});

app.get("/approval", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "approval.html"));
});

app.get("/approval-edit", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "approval-edit.html"));
});

// API routes
const loginRoutes = require("./login");
app.use("/api", loginRoutes);
const createRoutes = require("./createRequest");
app.use("/api", createRoutes);
const trackRoutes = require("./track");
app.use("/api", trackRoutes);
const reviewRoutes = require("./review");
app.use("/api", reviewRoutes);
const managerRoutes = require("./managerapproval");   // ✅ add this
app.use("/api", managerRoutes);
const approverRoutes = require("./approver");
app.use("/api", approverRoutes);
const updateMaterialRoutes = require("./updateMaterial");
app.use("/api", updateMaterialRoutes);

const PORT = 3101;

poolConnect.then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running at http://localhost:${PORT}`);
        console.log("✅ SQL Pool connected successfully");
    });
}).catch(err => {
    console.error("❌ Failed to connect to SQL Pool:", err.message);
});