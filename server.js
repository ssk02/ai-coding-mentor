/*const pool = require("./config/db");

(async () => {
    try {
        await pool.getConnection();
        console.log("✅ MySQL connected");
    } catch (err) {
        console.error("❌ DB connection failed", err);
    }
})();*/
const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});