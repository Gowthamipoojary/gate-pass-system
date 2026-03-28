const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("./database");
router.get("/update-status", async (req, res) => {
try {
await poolConnect;
const { month, gatepass } = req.query;

let query = `
SELECT 
id,
gatepass_no,
vendor_name,
gate_pass_type,
status,
gate_pass_date
FROM GatePass
WHERE status IN ('Approved','Pending','Completed','Cancelled')
`;

const request = pool.request();
if (month) {
    const startDate = month + "-01"; // e.g. 2026-03-01
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    query += ` AND gate_pass_date >= @startDate AND gate_pass_date < @endDate`;

    request.input("startDate", sql.Date, startDate);
    request.input("endDate", sql.Date, endDate);
}

if(gatepass){
query += ` AND gatepass_no LIKE @gatepass`;
request.input("gatepass", sql.VarChar, `%${gatepass}%`);
}

query += `
ORDER BY 
CASE 
WHEN status='Approved' THEN 1
WHEN status='Pending' THEN 2
WHEN status='Completed' THEN 3
WHEN status='Cancelled' THEN 4
END,
id DESC
`;

const result = await request.query(query);

res.json(result.recordset);

}catch(error){
console.error(error);
res.status(500).send("Server Error");
}
});

router.get("/gatepass-items/:id", async (req,res)=>{
await poolConnect;
const result = await pool.request()
.input("id", sql.Int, req.params.id)
.query(`
SELECT 
id,
description,
unit,
quantity,
ISNULL(returned_quantity,0) AS returned_quantity,
(quantity - ISNULL(returned_quantity,0)) AS pending_quantity
FROM GatePassItems
WHERE gatepass_id = @id
`);
res.json(result.recordset);
});


router.put("/complete/:id", async (req,res)=>{
await poolConnect;
await pool.request()
.input("id", sql.Int, req.params.id)
.query(`
UPDATE GatePass
SET 
status='Completed',
closed_at = GETDATE()
WHERE id=@id
`);
res.send("Updated");
});


router.post("/update-return", async (req, res) => {

try {

    // Ensure DB connection
    await poolConnect;
    const { gatepass_id, materials } = req.body;

    // Validation
    if (!gatepass_id || !materials || materials.length === 0) {
        return res.status(400).send("Invalid data received");
    }

    // Update returned quantities
    for (const item of materials) {
        const returnedQty = parseInt(item.returnedQty) || 0;
        if (returnedQty > 0) {
    // Update total returned quantity
    await pool.request()
        .input("id", sql.Int, item.id)
        .input("returnedQty", sql.Int, returnedQty)
        .query(`
            UPDATE GatePassItems
            SET returned_quantity =
            CASE 
                WHEN ISNULL(returned_quantity,0) + @returnedQty > quantity
                THEN quantity
                ELSE ISNULL(returned_quantity,0) + @returnedQty
            END
            WHERE id = @id
        `);

    // Insert return history with date & time
    await pool.request()
        .input("itemId", sql.Int, item.id)
        .input("returnedQty", sql.Int, returnedQty)
        .query(`
            INSERT INTO GatePassReturnHistory (gatepass_item_id, returned_qty, returned_at)
VALUES (@itemId, @returnedQty, GETDATE())
        `);
}
    }

    // Check if all materials returned
    const result = await pool.request()
        .input("gatepass_id", sql.Int, gatepass_id)
        .query(`
            SELECT quantity, ISNULL(returned_quantity,0) AS returned_quantity
            FROM GatePassItems
            WHERE gatepass_id = @gatepass_id
        `);

    let completed = true;

    result.recordset.forEach(row => {
        const pending = row.quantity - row.returned_quantity;
        if (pending > 0) {
            completed = false;
        }
    });

    if (completed) {

        // All materials returned
        await pool.request()
            .input("gatepass_id", sql.Int, gatepass_id)
            .query(`
                UPDATE GatePass
                SET 
                    status = 'Completed',
                    closed_at = GETDATE()
                WHERE id = @gatepass_id
            `);

    } else {

        // Some materials still pending
        await pool.request()
            .input("gatepass_id", sql.Int, gatepass_id)
            .query(`
                UPDATE GatePass
                SET status = 'Pending'
                WHERE id = @gatepass_id
            `);

    }

    res.send({ message: "Return quantities updated successfully" });

} catch (error) {

    console.error("Error updating return:", error);
    res.status(500).send("Server error while updating return");

}

});

router.put("/cancel/:id", async (req, res) => {
const reason = req.body.reason;  
await pool.request()
.input("id", sql.Int, req.params.id)
.input("reason", sql.VarChar(255), reason)
.query(`
UPDATE GatePass
SET status = 'Cancelled',
closed_at = GETDATE(),
cancel_reason = @reason
WHERE id = @id
`);
res.json({ message: "Gatepass Cancelled" });
});

module.exports = router;