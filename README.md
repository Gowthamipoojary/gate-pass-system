# 🚀 Gate Pass Management System

## 📌 About the Project

The Gate Pass Management System is a full-stack web application developed to digitize and automate the process of managing employee movement and material handling within an organization.

It provides a structured workflow to create, review, approve, and track gate pass requests, including handling of **returnable and non-returnable items**, along with real-time status tracking and automated email notifications.

---

## 🎯 Problem Statement

This system addresses real-world operational challenges such as:

* Manual and inefficient gate pass handling
* No proper tracking of returnable materials
* Lack of visibility across approval stages
* Delays due to manual communication
* No centralized audit trail

---

## ⚙️ System Workflow (End-to-End)

### 🔄 Complete Flow

```
User → Manager → Reviewer → Approver L1 → Approver L2 → Return Tracking → Completion
```

---

### 🧩 Step-by-Step Execution

#### 🟢 1. User (Request Creation)

* Logs into the system
* Creates a gate pass request
* Enters:

  * Department, Vendor, Purpose, Vehicle details
* Adds multiple items:

  * Returnable / Non-returnable
* System generates unique Gate Pass Number:

  * `R-01` → Returnable
  * `NR-01` → Non-returnable

📌 Status: **Pending Manager Approval**

---

#### 📧 2. Manager Notification

* System automatically sends email to department manager
* Manager receives request instantly

---

#### 👨‍💼 3. Department Manager Approval

* Views requests based on department
* Can:

  * Approve & forward
  * Reject / Cancel

📌 Status: **Submitted**

---

#### 🧾 4. Reviewer Validation

* Reviews and edits gate pass details
* Ensures correctness of:

  * Vendor, Purpose, Date, Items
* Assigns:

  * Approver L1
  * Approver L2

📌 Status: **Reviewed**

---

#### 📤 5. Send to Approver

* System sends email to **Approver L1**
* Approval chain begins

---

#### ✅ 6. Level 1 Approval

* L1 Approver verifies request
* System updates:

  * `l1_approved_at`
  * `l1_approved_by`

📌 Status: **L1 Approved**
📧 Mail sent to L2

---

#### ✅ 7. Level 2 Approval (Final)

* Final validation by L2
* System updates:

  * `l2_approved_at`
  * `l2_approved_by`

📌 Status: **Approved**
📧 Mail sent to User

---

#### 📦 8. Returnable Item Tracking (Advanced Feature)

* Tracks returned quantity for each item
* Maintains:

  * `returned_quantity`
  * Return history logs

### 🔁 Logic:

* If all items returned → **Completed**
* If partially returned → **Pending**

---

#### 📊 9. Tracking & Monitoring

* Users can:

  * View all gate passes
  * Search by:

    * Gate Pass Number
    * Department
    * Vendor
* View:

  * Full details
  * Items
  * Approval history

---

#### ❌ 10. Cancellation / Rejection

* Gate pass can be:

  * Rejected by approvers
  * Cancelled with reason

📌 Status: **Cancelled**

---

## 📊 Status Lifecycle

```
Pending Manager Approval
        ↓
Submitted
        ↓
Reviewed
        ↓
L1 Approved
        ↓
Approved
        ↓
Pending (if return incomplete)
        ↓
Completed (after full return)
        ↓
Cancelled (optional)
```

---

## 👥 User Roles

| Role        | Responsibilities               |
| ----------- | ------------------------------ |
| User        | Create gate pass, track status |
| Manager     | Department-level approval      |
| Reviewer    | Validate and assign approvers  |
| Approver L1 | First-level approval           |
| Approver L2 | Final approval                 |

---

## ✨ Core Features

* 🔐 Role-Based Authentication (Session-based)
* 📝 Gate Pass Creation with dynamic item entry
* 📦 Returnable & Non-Returnable Item Management
* 🔄 Multi-Level Approval Workflow
* 📧 Automated Email Notifications (Nodemailer)
* 📊 Real-Time Status Tracking
* 🧾 Audit Trail (timestamps & approvals)
* 🔍 Advanced Search & Filtering
* 📈 Return Tracking with History Logs

---

## 🛠 Tech Stack

| Layer          | Technology            |
| -------------- | --------------------- |
| Frontend       | HTML, CSS, JavaScript |
| Backend        | Node.js, Express.js   |
| Database       | Microsoft SQL Server  |
| Authentication | Express Sessions      |
| Email Service  | Nodemailer (SMTP)     |

---

## 🗄️ Database Design

### Main Tables:

* **Users**
* **GatePass**
* **GatePassItems**
* **GatePassReturnHistory**

### Key Fields:

* `gatepass_no`
* `status`
* `approver_l1`, `approver_l2`
* `l1_approved_at`, `l2_approved_at`
* `returned_quantity`

---

## 🏗️ Architecture

* Modular Express routes
* SQL connection pooling
* Session-based authentication
* Async email handling (non-blocking)

---

## 📦 Project Status

This project was developed as part of a real-world enterprise use case, focusing on workflow automation, multi-level approvals, and material tracking systems. 

---

## 👩‍💻 Developer

**Gowthami Poojary**
B.Tech – Computer Science & Engineering

---

## 🚀 Setup Guide

Clone the repository:

```bash
git clone https://github.com/your-username/gate-pass-system.git
```

Install dependencies:

```bash
npm install
```

Run the server:

```bash
node server.js
```

Access application:

```
http://localhost:3101
```

---

## 🔐 Security Note

Sensitive data such as database credentials, internal IPs, and email configurations have been excluded for security purposes.

---

## ⭐ Future Enhancements

* Email approval links (one-click approval)
* Dashboard analytics & reports
* Mobile responsive UI
* Export to Excel/PDF
* Role-based dashboards

---
