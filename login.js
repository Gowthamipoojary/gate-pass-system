const express = require("express");
const router = express.Router();
// Import database
const { sql, pool, poolConnect } = require("./database");
// Login API
router.post("/login", async (req, res) => {
    try {
        await poolConnect;
        let { email, password, page } = req.body;
        // Default page protection
        if (!page) page = "track";
        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query(`
                SELECT id, name, email, role, department
                FROM Users
                WHERE email = @email AND password = @password
            `);

        if (result.recordset.length === 0) {
            return res.json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const user = result.recordset[0];

        const roles = user.role
            .toLowerCase()
            .split(",")
            .map(r => r.trim());

        req.session.user = user;
        let redirectPage = "/";

// Track → Everyone
if (page === "track") {
    redirectPage = "/track.html";
}

// Create → Only user
else if (page === "create") {
    if (!roles.includes("user")) {
        return res.json({
            success: false,
            roles: roles ,
            message: "Only users can create requests"
        });
    }
    redirectPage = "/create.html";
}

// ✅ Manager
else if (page === "manager") {
    if (!roles.includes("manager")) {
        return res.json({
            success: false,
            roles: roles ,
            message: "Only managers can access this page"
        });
    }
    redirectPage = "/deptManager.html";
}

// ✅ Reviewer
else if (page === "reviewer") {
    if (!roles.includes("reviewer")) {
        return res.json({
            success: false,
            roles: roles ,
            message: "Only reviewers can access this page"
        });
    }
    redirectPage = "/review.html";
}

// ✅ Update
else if (page === "update") {
    if (!roles.some(r => r === "reviewer")) {
        return res.json({
            success: false,
            roles: roles ,
            message: "Only reviewers can access update page"
        });
    }
    redirectPage = "/update.html";
}

// ✅ Approval (L1 + L2)
else if (page === "approval") {
    if (!roles.includes("approverl1") && !roles.includes("approverl2")) {
        return res.json({
            success: false,
            roles: roles ,
            message: "Only approvers can access this page"
        });
    }
    redirectPage = "/approval.html";
}
        res.json({
            success: true,
            user: user,
            roles: roles ,
            redirect: redirectPage
        });
        

    } catch (err) {
        console.error(err);
        res.status(500).send("Login error");
    }
});

module.exports = router;