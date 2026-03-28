const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user:"User Email",
    pass: "Passward"
  }
});

async function generateMailManager(emails, gatepassNo, vendor, purpose) {
  const appLink = `http://localhost:3101?role=manager`;
  const mailOptions = {
    from: "Gate Pass System <emilgatepass@essilor.in>",
    to: emails.join(","),
    subject: `Gate Pass Waiting for Manager Approval - ${gatepassNo}`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2 style="color:#2c3e50;">Manager Approval Required</h2>
      <p>Dear Department Manager,</p>
      <p>
      A new gate pass request has been submitted and is awaiting your approval.
      Please review the details below.
      </p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td><b>Gate Pass Number</b></td>
          <td>${gatepassNo}</td>
        </tr>
        <tr>
          <td><b>Vendor</b></td>
          <td>${vendor}</td>
        </tr>
        <tr>
          <td><b>Purpose</b></td>
          <td>${purpose}</td>
        </tr>
      </table>
      <br>
      <p>
      Kindly review and approve the request.
      </p>
      <a href="${appLink}" 
         style="
         background-color:#28a745;
         color:white;
         padding:10px 18px;
         text-decoration:none;
         border-radius:5px;
         display:inline-block;">
         Review Request
      </a>
      <br><br>
      <p>
      Regards,<br>
      <b>Gate Pass Management System</b>
      </p>
      <hr>
      <small>
      This is an automated email. Please do not reply.
      </small>
    </div>
    `
  };
  await transporter.sendMail(mailOptions);
}

async function generateMail(emails, gatepassNo, vendor, purpose) {
  const appLink = `http://localhost:3101?role=reviewer`; 
  const mailOptions = {
    from: "Gate Pass System <emilgatepass@essilor.in>",
    to: emails.join(","),
    subject: `Gate Pass Request Submitted - ${gatepassNo}`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2 style="color:#2c3e50;">Gate Pass Request Notification</h2>
      <p>Dear Reviewer,</p>
      <p>
      A new gate pass request has been submitted in the system. 
      Please review the request details below.
      </p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td><b>Gate Pass Number</b></td>
          <td>${gatepassNo}</td>
        </tr>
      </table>
      <br>
      <p>
      Kindly review and take necessary action by accessing the Gate Pass System.
      </p>
      <a href="${appLink}" 
         style="
         background-color:#2c7be5;
         color:white;
         padding:10px 18px;
         text-decoration:none;
         border-radius:5px;
         display:inline-block;">
         View Request
      </a>
      <br><br>
      <p>
      Regards,<br>
      <b>Gate Pass Management System</b>
      </p>
      <hr>
      <small>
      This is an automated email. Please do not reply to this message.
      </small>
    </div>
    `
  };
  await transporter.sendMail(mailOptions);
}

async function generateMailL1(emails, gatepassNo) {
  const appLink = `http://localhost:3101?role=approval`;
  const mailOptions = {
    from: "Gate Pass System <emilgatepass@essilor.in>",
    to: emails.join(","),
    subject: `Gate Pass Waiting for Level 1 Approval - ${gatepassNo}`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2 style="color:#2c3e50;">Gate Pass Approval Required</h2>
      <p>Dear Approver,</p>
      <p>
      A gate pass request has been reviewed and is awaiting your Level 1 approval.
      </p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td><b>Gate Pass Number</b></td>
          <td>${gatepassNo}</td>
        </tr>
      </table>
      <br>
      <a href="${appLink}" 
         style="
         background-color:#2c7be5;
         color:white;
         padding:10px 18px;
         text-decoration:none;
         border-radius:5px;
         display:inline-block;">
         Open Gate Pass
      </a>
      <br><br>
      <p>
      Regards,<br>
      <b>Gate Pass Management System</b>
      </p>

    </div>
     <hr>
      <small>
      This is an automated email. Please do not reply to this message.
      </small>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function generateMailL2(emails, gatepassNo) {
  const appLink = `http://localhost:3101?role=approval`;
  const mailOptions = {
    from: "Gate Pass System <emilgatepass@essilor.in>",
    to: emails.join(","),
    subject: `Gate Pass Waiting for Final Approval - ${gatepassNo}`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2 style="color:#2c3e50;">Final Approval Required</h2>
      <p>Dear Approver,</p>
      <p>
      This gate pass has been approved by Level 1 and now requires your final approval.
      </p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td><b>Gate Pass Number</b></td>
          <td>${gatepassNo}</td>
        </tr>
      </table>
      <br>
      <a href="${appLink}" 
         style="
         background-color:#2c7be5;
         color:white;
         padding:10px 18px;
         text-decoration:none;
         border-radius:5px;
         display:inline-block;">
         Open Gate Pass
      </a>
      <br><br>
      <p>
      Regards,<br>
      <b>Gate Pass Management System</b>
      </p>
       <hr>
      <small>
      This is an automated email. Please do not reply to this message.
      </small>
    </div>
    `
  };
  await transporter.sendMail(mailOptions);
}

async function generateMailUser(emails, gatepassNo) {
  const appLink = `http://localhost:3101`;
  const mailOptions = {
    from: "Gate Pass System <emilgatepass@essilor.in>",
    to: emails.join(","),
    subject: `Gate Pass Approved - ${gatepassNo}`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2 style="color:#2c3e50;">Gate Pass Approved</h2>
      <p>Dear User,</p>
      <p>
      Your gate pass request has been successfully approved.
      </p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td><b>Gate Pass Number</b></td>
          <td>${gatepassNo}</td>
        </tr>
      </table>
      <br>
      <p>
      You may now proceed with the required process.
      </p>
      <br>
      <p>
      Regards,<br>
      <b>Gate Pass Management System</b>
      </p>
       <hr>
      <small>
      This is an automated email. Please do not reply to this message.
      </small>

    </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  generateMail,
  generateMailManager,
  generateMailL1,
  generateMailL2,
  generateMailUser
};
