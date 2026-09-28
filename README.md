# Government Budget Monitoring System (GBMS)

A full-stack Government Budget Monitoring System built using the MEAN stack to monitor department budgets, expenditures, utilization, alerts, and financial reports.

## 🚀 Features

- User authentication and authorization
- Role-based access control
- Admin Panel
- Department management
- Budget allocation and tracking
- Expenditure management
- Budget utilization monitoring
- Financial alerts
- CSV report generation
- PDF summary reports
- Dashboard analytics
- MongoDB Atlas database
- Responsive modern UI

## 👥 User Roles

### Admin

- Manage users
- Manage departments
- Access reports
- Monitor the complete system

### Finance Officer

- Manage departments
- Create and manage budgets
- Record expenditures
- View reports
- Monitor budget utilization

### Department Head

- View department-related financial information
- Monitor budgets and expenditures
- View alerts

## 🛠️ Tech Stack

### Frontend

- Angular
- TypeScript
- HTML5
- CSS3
- Chart.js
- ng2-charts

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt.js

### Database

- MongoDB
- MongoDB Atlas

## 📁 Project Structure

```text
GBMS-Mean-Stack/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── angular.json
│   └── package.json
│
└── README.md
```

⚙️ Installation

1. Clone the repository
   git clone https://github.com/PDubey-tech26/GBMS-Mean-Stack.git
   cd GBMS-Mean-Stack
2. Backend setup
   cd backend
   npm install

Create a .env file:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

Start backend:

npm run dev

Backend runs on:

http://localhost:5000 3. Frontend setup

Open another terminal:

cd frontend
npm install
npm start

Frontend runs on:

http://localhost:4200
🔐 Security
Environment variables are stored in .env
.env is excluded from Git
Passwords are hashed using bcrypt
JWT-based authentication is implemented
Role-based authorization protects restricted routes
📊 Main Modules
Module Description
Dashboard Budget and expenditure analytics
Departments Department management
Budgets Budget allocation and tracking
Expenditures Expense recording and monitoring
Alerts Budget utilization alerts
Reports CSV and PDF reports
Admin Panel User and system administration
🎯 Project Objective

The objective of GBMS is to provide a centralized platform for monitoring government department budgets and expenditures while improving financial visibility through dashboards, alerts, and reports.

👨‍💻 Developer

Priyanshu Dubey

GitHub: https://github.com/PDubey-tech26

📄 License

This project is developed for educational and portfolio purposes.
