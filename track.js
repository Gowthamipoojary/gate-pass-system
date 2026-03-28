const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("./database");


// Get full Gate Pass details + items
router.get("/gatepass/:id", async (req, res) => {
    try {
        // Ensure DB is connected
        await poolConnect;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid Gate Pass ID" });
        }
        // 1. Get GatePass + User details
        const gatepassResult = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    gp.id,
                    gp.gatepass_no,
                    gp.from_location,
                    gp.department,
                    gp.gate_pass_date,
                    gp.gate_pass_type,
                    gp.vendor_name,
                    gp.purpose,
                    gp.authority,
                    gp.through_person,
                    gp.vehicle_no,
                    gp.status,
                    gp.created_at,
                    gp.reviewed_by,
                    gp.reviewed_at,
                    gp.l1_approved_by,
                    gp.l1_approved_at,
                    gp.l2_approved_by,
                    gp.l2_approved_at,
                    gp.cancel_reason,
                    u.name AS user_name,
                    u.department AS user_department,
                    u.email
                FROM GatePass gp
                LEFT JOIN Users u ON gp.user_id = u.id
                WHERE gp.id = @id
            `);

        if (gatepassResult.recordset.length === 0) {
            return res.status(404).json({ message: "Gate Pass not found" });
        }
       
       // 2. Get Material Items
const itemsResult = await pool.request()
    .input("id", sql.Int, id)
    .query(`
        SELECT 
            description,
            unit,
            quantity,
            ISNULL(returned_quantity,0) AS returned_quantity
        FROM GatePassItems
        WHERE gatepass_id = @id
    `);
        // 3. Send response
        res.json({
            gatepass: gatepassResult.recordset[0],
            items: itemsResult.recordset
        });

    } catch (err) {
        console.error("GatePass Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/gatepasses", async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request().query(`
             SELECT 
                id,
                gatepass_no,
                gate_pass_date,
                department,
                vendor_name,
                status
            FROM GatePass
            ORDER BY id DESC
        `);
        res.json(result.recordset);
    } catch (err){
        console.error("Fetch GatePasses Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/search", async (req, res) => {
    try {
        await poolConnect;

        const keyword = req.query.keyword;

        const result = await pool.request()
            .input("keyword", sql.VarChar, `%${keyword}%`)
            .query(`
                SELECT 
                    id,
                    gatepass_no,
                    gate_pass_date,
                    department,
                    vendor_name,
                    status
                FROM GatePass
                WHERE 
                    gatepass_no LIKE @keyword
                    OR department LIKE @keyword
                    OR vendor_name LIKE @keyword
                ORDER BY id DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/return-history/:gatepassId", async (req,res)=>{
try{
await poolConnect;
const result = await pool.request()
.input("gatepassId", sql.Int, req.params.gatepassId)
.query(`
SELECT 
gp.gatepass_no,
gpi.description,
rh.returned_qty,
rh.returned_at
FROM GatePassReturnHistory rh
JOIN GatePassItems gpi ON rh.gatepass_item_id = gpi.id
JOIN GatePass gp ON gpi.gatepass_id = gp.id
WHERE gp.id = @gatepassId
ORDER BY rh.returned_at DESC
`);
res.json(result.recordset);

}catch(err){
console.error(err);
res.status(500).send("Error fetching return history");
}
});



module.exports = router;