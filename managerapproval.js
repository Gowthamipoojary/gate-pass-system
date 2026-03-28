const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("./database");
const { generateMail } = require("./generateMail");

router.get("/manager-requests", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("User not logged in");
        }
        const department = req.session.user.department;
        const result = await pool.request()
            .input("department", sql.VarChar, department)
            .query(`
                SELECT *
                FROM GatePass
                WHERE department = @department
                AND status = 'Pending Manager Approval'
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching requests");
    }
});

router.get("/gatepass/:id", async (req, res) => {
try {
const id = req.params.id;
const gpResult = await pool.request()
.input("id", sql.Int, id)
.query(`
SELECT *
FROM GatePass
WHERE id = @id
`);
const itemResult = await pool.request()
.input("id", sql.Int, id)
.query(`
SELECT *
FROM GatePassItems
WHERE gatepass_id = @id
`);
res.json({
gatepass: gpResult.recordset[0],
items: itemResult.recordset
});
} catch (err) {
console.error(err);
res.status(500).send("Error fetching gate pass");
}
});

router.post("/send-review", async (req, res) => {
  try {
    const { gatepass_no } = req.body;

    /* 1️⃣ Update status */
    await pool.request()
      .input("gatepass_no", sql.VarChar, gatepass_no)
      .query(`
        UPDATE GatePass
        SET status = 'Submitted'
        WHERE gatepass_no = @gatepass_no
      `);

    /* 2️⃣ Get gatepass details */
    const gpResult = await pool.request()
      .input("gatepass_no", sql.VarChar, gatepass_no)
      .query(`
        SELECT * FROM GatePass WHERE gatepass_no = @gatepass_no
      `);

    const gp = gpResult.recordset[0];
    /* 3️⃣ Get reviewer emails */
    const reviewerResult = await pool.request()
      .query(`
        SELECT email FROM users WHERE LOWER(role) LIKE '%manager%'
      `);
    const reviewerEmails = reviewerResult.recordset.map(r => r.email);
    res.json({ success: true });
    generateMail(
      reviewerEmails,
      gp.gatepass_no,
      gp.vendor_name,
      gp.purpose
    ).catch(err => {
      console.error("Email failed:", err);
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending for review");
  }
});

router.post("/cancel-gatepass", async (req, res) => {
    try {
        const { gatepass_no, remark } = req.body;

        await pool.request()
            .input("gatepass_no", sql.VarChar, gatepass_no)
            .input("remark", sql.VarChar, remark)
            .query(`
                UPDATE GatePass
                SET status = 'Cancelled',
                    cancel_reason = @remark,
                    closed_at = GETDATE()
                WHERE gatepass_no = @gatepass_no
            `);
        res.json({ success: true });
    } catch (err) {
        console.error(err);

        res.status(500).json({ success: false, message: "Error cancelling gatepass" });
    }
});

module.exports = router;