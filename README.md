# BudgetWise - Personal Finance Manager

BudgetWise is a world-class personal budgeting and expense tracking application built to help users take control of their financial lives. It provides a comprehensive suite of tools to track transactions, set category-based budgets, visualize spending patterns, and generate professional financial reports.

## Features

### Interactive Dashboard
*   **Real-time Overview:** View your total balance, monthly income, and monthly expenses at a glance.
*   **Recent Activity:** Stay updated with a quick list of your latest transactions.
*   **Budget Tracking:** Visual progress bars showing how much of your active budgets have been consumed.
*   **Spending Alerts:** Automatic warnings when your spending exceeds 80% of your monthly income.

### Transaction Management
*   **Income & Expenses:** Easily record and categorize every financial movement.
*   **Smart Filtering:** Filter transactions by type, category, or custom date ranges.
*   **Detailed Logging:** Support for descriptions and specific sources for income entries.

### Budgeting & Goals
*   **Category-Based Limits:** Set monthly spending limits for specific categories (e.g., Food, Transport, Utilities).
*   **Alert Thresholds:** Configure custom percentage-based alerts (e.g., get notified at 80% usage).
*   **Status Indicators:** Color-coded badges for "Active", "Near Limit", and "Exceeded" budgets.

### Advanced Reporting
*   **Data Visualization:** Interactive bar and doughnut charts powered by Chart.js.
*   **Export Options:** Generate and download professional financial reports in **Excel (.xlsx)**, **PDF**, and **CSV** formats using a custom-built `ExporterFactory`.
*   **Historical Analysis:** Compare month-on-month income and expenses.

### User Profile & Preferences
*   **Custom Categories:** Create your own categories beyond the system defaults.
*   **Preference Management:** Toggle notifications for goals and budget alerts.
*   **Currency Customization:** Multi-currency support (EGP, USD, EUR).

### Admin Console
*   **User Management:** View all registered users and their activities.
*   **Role Control:** Manage user permissions and elevate users to Admin status.
*   **System Stats:** Monitor total system usage across transactions, budgets, and goals.

## System Design & Architecture

### The Design Phase: Class Diagrams
A significant portion of our development lifecycle was dedicated to the **System Design Specification (SDS)** phase. We focused heavily on designing comprehensive Class Diagrams to map out the relationships between our core entities: `User`, `Transaction`, `Budget`, and `Category`. 

By defining these relationships (e.g., the One-to-Many relationship between a User and their Budgets) early on, we were able to ensure strict data integrity and a decoupled service layer. This architectural planning was pivotal in implementing the **Factory Pattern** for our reporting exports and ensuring that the JWT security context is seamlessly integrated across all service calls.

### Architecture Visuals
!Class Diagram
*Figure 1: High-level class diagram showing the interaction between the Controller, Service, and Repository layers.*

!Database Schema
*Figure 2: Entity Relationship Diagram (ERD) for the BudgetWise database.*

## Tech Stack

*   **Backend:** Java 17, Spring Boot, Spring Security (JWT-based authentication).
*   **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom themes & Skeleton loaders).
*   **Data Export:** Apache POI (Excel), iText/OpenCSV (PDF/CSV).
*   **Charts:** Chart.js.
*   **Build Tool:** Maven (via `mvnw` wrapper).

## Prerequisites

*   **Java Development Kit (JDK) 17** or higher.
*   **Maven** (optional, as the project includes `mvnw`).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/personal-budget.git
    cd personal-budget
    ```

2.  **Configure the database:**
    Update `src/main/resources/application.properties` with your database credentials (default is configured for H2 or PostgreSQL).

3.  **Build the project:**
    ```bash
    ./mvnw clean install
    ```

4.  **Run the application:**
    ```bash
    ./mvnw spring-boot:run
    ```

5.  **Access the UI:**
    Open your browser and navigate to `http://localhost:8080`.

## Project Structure

```text
src/main/java/com/example/personal_budget/
├── dto/                 # Data Transfer Objects for API requests/responses
├── entity/              # JPA Entities (User, Transaction, Budget, Category)
├── enums/               # Transaction and Category types
├── repository/          # Spring Data JPA Repositories
├── service/             # Business Logic (ReportService, TransactionService, etc.)
├── controller/          # REST Controllers
└── util/                # Utility classes (ExcelExporter, ExporterFactory)

src/main/resources/
├── static/
│   ├── css/             # Stylesheets (including custom loading animations)
│   └── js/              # Frontend logic (Dashboard, Transactions, Reports, etc.)
└── templates/           # HTML views
```

## API Highlights

*   `POST /api/reports/monthly`: Generates data for dashboard charts.
*   `POST /api/reports/download`: Initiates a file download based on format (EXCEL/PDF/CSV).
*   `GET /api/budgets/active`: Fetches currently running budgets for the user.
*   `PUT /api/notifications/{id}/read`: Marks specific alerts as read.

## Learning Outcomes

Through the development of BudgetWise, we have gained practical experience in:
*   **REST API Design:** Building robust, scalable, and stateless endpoints using Spring Boot.
*   **Security:** Implementing JWT-based authentication and role-based access control (RBAC).
*   **Frontend-Backend Integration:** Coordinating asynchronous data flow between a vanilla JavaScript frontend and a Java backend.
*   **Data Management:** Handling complex relationships and data persistence with Spring Data JPA and Hibernate.
*   **System Architecture:** Applying design patterns like the Factory Pattern for modular reporting services.

## Contributing

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

Distributed under the Apache License 2.0. See `mvnw.cmd` header for licensing details.

---
Developed with ❤️ by:
*   **Abdelhamid Ahmed**
*   **Ammar Ayman**
*   **Yousef Saleh**
*   **Mostafa Ahmed**
