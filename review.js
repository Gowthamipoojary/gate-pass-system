const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("./database");
const { 
  generateMail,
  generateMailL1,
  generateMailL2,
  generateMailUser
} = require("./generateMail");

router.get("/review-list", async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request().query(`
           SELECT 
    gatepass_no, 
    gate_pass_date, 
    department, 
    vendor_name, 
    status,
    approver_l1,
    approver_l2,
    l1_approved_at,
    l2_approved_at
FROM GatePass
WHERE l2_approved_at IS NULL
ORDER BY created_at DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading review list");
    }
});

router.get("/review-search", async (req, res) => {
    try {
        await poolConnect;

        const keyword = `%${req.query.keyword}%`;

        const result = await pool.request()
            .input("keyword", sql.VarChar, keyword)
            .query(`
                SELECT gatepass_no, gate_pass_date, department, vendor_name, status
                FROM GatePass
                WHERE status = 'Submitted'
                AND (
                    gatepass_no LIKE @keyword
                    OR vendor_name LIKE @keyword
                    OR department LIKE @keyword
                )
                ORDER BY created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).send("Search error");
    }
});

router.get("/gatepass-by-no/:gpNo", async (req, res) => {
    try {
        await poolConnect;
        const gpNo = req.params.gpNo;
        const gpResult = await pool.request()
            .input("gpNo", sql.VarChar, gpNo)
            .query(`
                SELECT * FROM GatePass
                WHERE gatepass_no = @gpNo
            `);
        if (gpResult.recordset.length === 0) {
            return res.status(404).send("Not found");
        }
        const gatepass = gpResult.recordset[0];

        const itemsResult = await pool.request()
            .input("id", sql.Int, gatepass.id)
            .query(`
                SELECT description, unit, quantity
                FROM GatePassItems
                WHERE gatepass_id = @id
            `);

        res.json({
            gatepass,
            items: itemsResult.recordset
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading gatepass");
    }
});

router.post("/review-update", async (req, res) => {
    try {
        await poolConnect;
        const {
            gatepass_no,
            vendor_name,
            purpose,
            through_person,
            vehicle_no,
            gate_pass_date,
            gate_pass_type
        } = req.body;

       const description = req.body.description;
       const unit = req.body.unit;
       const quantity = req.body.quantity;

        // Get gatepass id
        const gpResult = await pool.request()
            .input("gpNo", sql.VarChar, gatepass_no)
            .query(`SELECT id FROM GatePass WHERE gatepass_no = @gpNo`);
        const gatepassId = gpResult.recordset[0].id;

        // Update main table
       await pool.request()
    .input("vendor_name", sql.VarChar, vendor_name)
    .input("purpose", sql.VarChar, purpose)
    .input("through_person", sql.VarChar, through_person)
    .input("vehicle_no", sql.VarChar, vehicle_no)
    .input("gate_pass_date", sql.Date, gate_pass_date)
    .input("gate_pass_type", sql.VarChar, gate_pass_type)
    .input("status", sql.VarChar, "Reviewed")
    .input("reviewed_by", sql.VarChar, req.session?.user?.name || "Reviewer")
    .input("id", sql.Int, gatepassId)
    .query(`
        UPDATE GatePass
        SET vendor_name = ISNULL(@vendor_name, vendor_name),
            purpose = ISNULL(@purpose, purpose),
            through_person = ISNULL(@through_person, through_person),
            vehicle_no = ISNULL(@vehicle_no, vehicle_no),
            gate_pass_date = ISNULL(@gate_pass_date, gate_pass_date),
            gate_pass_type = ISNULL(@gate_pass_type, gate_pass_type),
            status = @status,
            reviewed_by = @reviewed_by,
            reviewed_at = GETDATE()
        WHERE id = @id
    `);

         res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).send("Review update error");
    }
});
router.get("/approvers", async (req, res) => {
    const result = await pool.request()
        .query(`
            SELECT id, name, role
FROM Users
WHERE role LIKE '%approverL1%' 
   OR role LIKE '%approverL2%'
        `);

    res.json(result.recordset);
});


router.post("/send-to-approver", async (req, res) => {

    const { gatepass_no, approver_l1, approver_l2 } = req.body;
    try {
        await pool.request()
            .input("gpNo", sql.VarChar, gatepass_no)
            .input("approverL1", sql.Int, approver_l1)
            .input("approverL2", sql.Int, approver_l2)
            .query(`
                UPDATE GatePass
                SET status = 'Reviewed',
                    approver_l1 = @approverL1,
                    approver_l2 = @approverL2,
                    reviewed_at = GETDATE()
                WHERE gatepass_no = @gpNo
            `);
        /* =========================
           1️⃣ SEND RESPONSE FIRST
        ========================= */
        res.json({ success: true });
        /* =========================
           2️⃣ SEND MAIL IN BACKGROUND
        ========================= */
        (async () => {
            try {
                const result = await pool.request()
                    .input("id", sql.Int, approver_l1)
                    .query(`SELECT email FROM Users WHERE id=@id`);
                if(result.recordset.length === 0) return;
                const email = result.recordset[0].email;
                await generateMailL1([email], gatepass_no);
            } catch (mailErr) {
                console.log("Mail sending failed:", mailErr);
            }
        })();
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});
router.post("/l1-approve", async (req, res) => {
    const { gatepass_no } = req.body;
    try {
        /* ======================
           1️⃣ UPDATE DATABASE
        ====================== */
        await pool.request()
            .input("gpNo", sql.VarChar, gatepass_no)
            .query(`
                UPDATE GatePass
                SET status='L1 Approved',
                    l1_approved_at = GETDATE()
                WHERE gatepass_no=@gpNo
            `);
        /* ======================
           2️⃣ SEND RESPONSE FIRST
        ====================== */
        res.json({ success: true });
        /* ======================
           3️⃣ SEND MAIL TO L2 IN BACKGROUND
        ====================== */
        (async () => {
            try {
                const result = await pool.request()
                    .input("gpNo", sql.VarChar, gatepass_no)
                    .query(`
                        SELECT u.email
                        FROM GatePass g
                        JOIN Users u ON g.approver_l2 = u.id
                        WHERE g.gatepass_no=@gpNo
                    `);
                if(result.recordset.length === 0) return;
                const email = result.recordset[0].email;
               await generateMailL2([email], gatepass_no);
            } catch (mailErr) {
                console.log("Mail sending failed:", mailErr);
            }
        })();
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
});

router.post("/l2-approve", async (req, res) => {
    const { gatepass_no } = req.body;
    try {
        /* ======================
           1️⃣ UPDATE DATABASE
        ====================== */
        await pool.request()
        .input("gpNo", sql.VarChar, gatepass_no)
        .query(`
            UPDATE GatePass
            SET status='Approved',
                l2_approved_at = GETDATE()
            WHERE gatepass_no=@gpNo
        `);
        /* ======================
           2️⃣ SEND RESPONSE FIRST
        ====================== */
        res.json({ success:true });
        /* ======================
           3️⃣ SEND MAIL IN BACKGROUND
           (example: notify user)
        ====================== */
        (async () => {
            try {
                const result = await pool.request()
                .input("gpNo", sql.VarChar, gatepass_no)
                .query(`
                    SELECT u.email
                    FROM GatePass g
                    JOIN Users u ON g.user_id = u.id
                    WHERE g.gatepass_no=@gpNo
                `);
                if(result.recordset.length === 0) return;
                const email = result.recordset[0].email;
                await generateMailUser([email], gatepass_no);
            } catch (mailErr) {
                console.log("Mail sending failed:", mailErr);
            }
        })();
    } catch(err){
        console.log(err);
        res.status(500).send("Error");
    }
});

module.exports = router;