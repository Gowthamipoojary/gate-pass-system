const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("./database");
const { generateMailL2, generateMailUser } = require("./generateMail");

router.get("/approver-list", async (req, res) => {
try {
await poolConnect;
const user = req.session.user;
if (!user) {
    return res.status(401).json({ error: "Not logged in" });
}
const result = await pool.request()
.input("approverId", sql.Int, user.id)
.query(`
SELECT 
    gatepass_no,
    gate_pass_date,
    department,
    vendor_name,
    status
FROM GatePass
WHERE
(
    status = 'Reviewed'
    AND approver_l1 = @approverId
)
OR
(
    status = 'L1 Approved'
    AND approver_l2 = @approverId
)
ORDER BY gate_pass_date DESC
`);
res.json(result.recordset);
}
catch(err){
console.error(err);
res.status(500).send("Error loading approvals");
}
});



router.post("/approve-gatepass", async (req, res) => {
try{
await poolConnect;
const { gatepass_no } = req.body;
const user = req.session.user;
const gp = await pool.request()
.input("gpNo", sql.VarChar, gatepass_no)
.query(`
SELECT approver_l1, approver_l2, status
FROM GatePass
WHERE gatepass_no = @gpNo
`);
const gatepass = gp.recordset[0];
if(!gatepass){
return res.status(404).json({message:"Gatepass not found"});
}

/* Level 1 Approval */

if(user.id === gatepass.approver_l1 && gatepass.status === "Reviewed"){

await pool.request()
.input("gpNo", sql.VarChar, gatepass_no)
.input("approvedBy", sql.VarChar, user.name)
.query(`
UPDATE GatePass
SET 
status = 'L1 Approved',
l1_approved_at = GETDATE(),
l1_approved_by = @approvedBy
WHERE gatepass_no = @gpNo
`);

/* GET L2 EMAIL */

const l2Result = await pool.request()
.input("gpNo", sql.VarChar, gatepass_no)
.query(`
SELECT u.email
FROM GatePass g
JOIN Users u ON g.approver_l2 = u.id
WHERE g.gatepass_no = @gpNo
`);


const l2Emails = l2Result.recordset.map(r => r.email);
/* SEND MAIL TO L2 */
res.json({message:"Level 1 approved"});

(async () => {
    try{
        if(l2Emails.length > 0){
            await generateMailL2(l2Emails, gatepass_no);
        }
    }
    catch(mailErr){
        console.log("L2 Mail failed:", mailErr);
    }
})();

return;
}

/* Level 2 Approval */
if(user.id === gatepass.approver_l2 && gatepass.status === "L1 Approved"){

await pool.request()
.input("gpNo", sql.VarChar, gatepass_no)
.input("approvedBy", sql.VarChar, user.name)
.query(`
UPDATE GatePass
SET 
status = 'Approved',
l2_approved_at = GETDATE(),
l2_approved_by = @approvedBy
WHERE gatepass_no = @gpNo
`);
/* GET USER EMAIL */
const userResult = await pool.request()
.input("gpNo", sql.VarChar, gatepass_no)
.query(`
SELECT u.email
FROM GatePass g
JOIN Users u ON g.user_id = u.id
WHERE g.gatepass_no = @gpNo
`);

const userEmails = userResult.recordset.map(r => r.email);
/* SEND MAIL TO USER */
res.json({message:"Final approval completed"});
(async () => {
    try{
        if(userEmails.length > 0){
            await generateMailUser(userEmails, gatepass_no);
        }
    }
    catch(mailErr){
        console.log("User Mail failed:", mailErr);
    }
})();

return;
}

res.status(403).json({message:"Not authorized"});
}
catch(err){
console.error(err);
res.status(500).send("Approval failed");
}
});

router.post("/reject-gatepass", async (req, res) => {
try{
await poolConnect;
const { gatepass_no } = req.body;
await pool.request()
.input("gpNo", sql.VarChar, gatepass_no)
.query(`
UPDATE GatePass
SET status = 'Rejected'
WHERE gatepass_no = @gpNo
`);
res.json({message:"Gatepass rejected"});
}
catch(err){
console.error(err);
res.status(500).send("Reject failed");
}
});

router.get("/approver-search", async (req, res) => {
try {
await poolConnect;
const user = req.session.user;
if (!user) {
return res.status(401).json({ error: "Not logged in" });
}
const keyword = req.query.keyword;
const result = await pool.request()
.input("keyword", sql.VarChar, `%${keyword}%`)
.input("approverId", sql.Int, user.id)
.query(`
SELECT 
    gatepass_no,
    gate_pass_date,
    department,
    vendor_name,
    status
FROM GatePass
WHERE
(
    (status = 'Reviewed' AND approver_l1 = @approverId)
    OR
    (status = 'L1 Approved' AND approver_l2 = @approverId)
)
AND
(
    gatepass_no LIKE @keyword
    OR vendor_name LIKE @keyword
    OR department LIKE @keyword
)
`);
res.json(result.recordset);
}
catch (err) {
console.error("Search error:", err);
res.status(500).json({ error: "Search failed" });
}
});

router.get("/gatepass-no/:gpNo", async (req, res) => {
 try {
  await poolConnect;
  const gpNo = req.params.gpNo;
  const gpResult = await pool.request()
   .input("gpNo", sql.VarChar, gpNo)
   .query(`
    SELECT 
      id,
      gatepass_no,
      from_location,
      department,
      gate_pass_date,
      gate_pass_type,
      vendor_name,
      purpose,
      through_person,
      vehicle_no
    FROM GatePass
    WHERE gatepass_no = @gpNo
   `);

  if (gpResult.recordset.length === 0) {
   return res.status(404).json({
    message: "Gatepass not found"
   });
  }

  const gatepass = gpResult.recordset[0];

  const itemResult = await pool.request()
   .input("id", sql.Int, gatepass.id)
   .query(`
    SELECT description, unit, quantity
    FROM GatePassItems
    WHERE gatepass_id = @id
   `);
  gatepass.items = itemResult.recordset;
  res.json(gatepass);
 } catch (err) {
  console.error("Fetch gatepass error:", err);
  res.status(500).json({
   message: "Error fetching gatepass"
  });
 }
});

module.exports = router;