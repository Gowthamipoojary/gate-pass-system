const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("./database");
const { generateMailManager } = require("./generateMail");

router.post("/create", async (req, res) => {
    try {
        await poolConnect;
        const {
    user_id, 
    from_location,
    department,
    gate_pass_date,
    gate_pass_type,
    vendor_name,
    purpose,
    authority,
    through_person,
    vehicle_no
} = req.body;

// Get array values correctly
const description = req.body["description[]"];
const unit = req.body["unit[]"];
const quantity = req.body["quantity[]"];
        /* =========================
           STEP 1: Generate GatePass No
        ========================= */
        const prefix = gate_pass_type === "Returnable" ? "R" : "NR";
        const countResult = await pool.request()
            .input("type", sql.VarChar, gate_pass_type)
            .query(`
                SELECT COUNT(*) AS total
                FROM GatePass
                WHERE gate_pass_type = @type
            `);
        const nextNumber = countResult.recordset[0].total + 1;
        const gatepassNo = prefix + "-" + String(nextNumber).padStart(2, "0");
        /* =========================
           STEP 2: Insert GatePass
        ========================= */
       const result = await pool.request()
    .input("gatepass_no", sql.VarChar, gatepassNo)
    .input("user_id", sql.Int, parseInt(user_id))
    .input("from_location", sql.VarChar, from_location)
    .input("department", sql.VarChar, department)
    .input("gate_pass_date", sql.Date, gate_pass_date)
    .input("gate_pass_type", sql.VarChar, gate_pass_type)
    .input("vendor_name", sql.VarChar, vendor_name)
    .input("purpose", sql.VarChar, purpose)
    .input("authority", sql.VarChar, authority)
    .input("through_person", sql.VarChar, through_person)
    .input("vehicle_no", sql.VarChar, vehicle_no)
    .input("status", sql.VarChar, "Pending Manager Approval")   
    .query(`
        INSERT INTO GatePass
        (gatepass_no, user_id, from_location, department, gate_pass_date, gate_pass_type, vendor_name, purpose, authority, through_person, vehicle_no, status)
        OUTPUT INSERTED.id
        VALUES
        (@gatepass_no, @user_id, @from_location, @department, @gate_pass_date, @gate_pass_type, @vendor_name, @purpose, @authority, @through_person, @vehicle_no, @status)
    `);

        const gatepassId = result.recordset[0].id;
        /* =========================
           STEP 3: Insert Items
        ========================= */
        const descArray = Array.isArray(description) ? description : (description ? [description] : []);
        const unitArray = Array.isArray(unit) ? unit : (unit ? [unit] : []);
        const qtyArray = Array.isArray(quantity) ? quantity : (quantity ? [quantity] : []);

        for (let i = 0; i < descArray.length; i++) {
    // Skip empty rows
    if (!descArray[i]) continue;
    await pool.request()
        .input("gatepass_id", sql.Int, gatepassId)
        .input("description", sql.VarChar, descArray[i])
        .input("unit", sql.VarChar, unitArray[i])
        .input("quantity", sql.Int, parseInt(qtyArray[i]) || 0)
        .query(`
            INSERT INTO GatePassItems
            (gatepass_id, description, unit, quantity)
            VALUES
            (@gatepass_id, @description, @unit, @quantity)
        `);
}

 /* =========================
   STEP 4: Send Response Immediately
    ========================= */
res.json({
    success: true,
    gatepassId: gatepassId,
    gatepassNo: gatepassNo
});
/* =========================
   STEP 5: Send Mail in Background
========================= */
(async () => {
    try {
        const managerResult = await pool.request()
        .input("department", sql.VarChar, department)
.query(`
    SELECT email 
    FROM users 
    WHERE LOWER(role) LIKE '%manager%' 
    AND department = @department
`);

       const managerEmails = managerResult.recordset.map(r => r.email);
        await generateMailManager(
            managerEmails,
            gatepassNo,
            vendor_name,
            purpose
        );
    } catch (mailErr) {
        console.log("Mail sending failed:", mailErr);
    }
})();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving Gate Pass");
    }
});

module.exports = router;