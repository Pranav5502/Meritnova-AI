# Meritnova — Talent Intelligence Platform

Meritnova is a full-stack talent-intelligence platform built with Spring Boot, MySQL, HTML, CSS, and JavaScript. Recruiters can publish and search roles; candidates can receive an explainable skill-fit score, matched skills, development areas, and an actionable recommendation.

## Portfolio highlights

- Recruiter workspace for publishing full-time, hybrid, and internship roles
- Candidate and recruiter registration, login/logout, and password-reset request flow
- Password hashes stored with BCrypt (no plain-text password storage)
- Open-position counts and real-time dashboard metrics
- Candidate application form collecting name, account email, education/qualification, and PDF resume (up to 5 MB)
- Duplicate-application prevention and personal status tracking
- Recruiter-only job posting workspace and application tracker with candidate name, email, education, resume download, and Under Review / Shortlisted / Rejected actions
- Package/CTC and experience-level details for every published role
- Searchable job board with company and role filtering
- Explainable resume-to-job skill matching and fit-score analysis
- Direct resume attachment and text extraction for PDF and DOCX files (up to 5 MB)
- REST APIs with Spring Boot, JPA/Hibernate, and MySQL persistence
- Responsive, dashboard-style JavaScript interface

## Resume bullet

**Meritnova — Full-Stack Talent Intelligence Platform** | Java, Spring Boot, MySQL, REST APIs, JavaScript

Built a recruiter-facing talent platform with role-based candidate/recruiter onboarding, searchable jobs, open-position metrics, and explainable skill-based candidate-fit scoring; designed REST APIs and MySQL persistence with Spring Data JPA, BCrypt password hashing, and a responsive JavaScript dashboard.

## What you need

- IntelliJ IDEA Community or Ultimate
- JDK 17 or newer
- MySQL Server 8+ running locally
- Maven (IntelliJ can download it automatically)

## Run it in IntelliJ IDEA

1. Download and extract this project.
2. Open IntelliJ IDEA, select **Open**, and choose the extracted `ai-job-portal` folder (select the folder containing `pom.xml`).
3. When IntelliJ asks to load Maven changes, choose **Load**. Set the project SDK to JDK 17 if requested.
4. Open MySQL Workbench or MySQL command line. You do not need to create a database manually because the app creates `ai_job_portal` when it starts.
5. Set the `DB_PASSWORD` environment variable to your local MySQL password. In IntelliJ, open **Run → Edit Configurations → Environment variables** and add `DB_PASSWORD=your_mysql_password`. The password is not stored in the project files.
6. If your MySQL username is not `root`, update `spring.datasource.username` in `src/main/resources/application.properties`.
7. Find `JobPortalApplication.java` and click the green Run arrow next to `main`.
8. Wait until IntelliJ shows that the application started. Open your browser at `http://localhost:8080`.
9. Register a **Recruiter** account to see the job-posting workspace. Register a **Candidate** account to apply. Candidates submit their details and a PDF resume; recruiters can review applicant details and download the resume.
## Resume upload

Candidates applying for jobs must complete the application form and attach a **PDF** resume (up to 5 MB). The AI matcher can also analyze pasted resume/profile text. The server extracts the document text and applies the same skill-matching analysis. Scanned/image-only PDFs do not contain readable text and require OCR, which is not included in this version.

## If it does not start

- **Access denied for user root:** your username or password in `application.properties` is wrong.
- **Port 8080 already in use:** change `server.port=8080` to `server.port=8081`, then open `http://localhost:8081`.
- **Java version error:** install JDK 17 and select it in IntelliJ under File → Project Structure → Project SDK.

## AI note

The project uses an explainable local matching engine, so it works without an API key or payment. It compares required skills with the resume text and creates a match score. For an advanced version, you can later connect an LLM API to generate richer suggestions.


## Final upgrade notes

- On startup, the app adds clearly-labelled `(Demo)` sample jobs that are missing from the database. These are fictional examples for testing and must not be presented as real vacancies.
- The **Live Job Search** section opens live search result pages on LinkedIn Jobs, Naukri and Indeed India. Listings are not scraped/imported or verified inside Meritnova; confirm each vacancy directly on the destination platform.
- Recruiter application filters default to active applications, with separate `Rejected only` and `All applications` filters. Candidates see `Already applied` on jobs they have applied to, and duplicate submissions are rejected by the backend.
- Forgot-password email OTP is **not enabled** in this build because SMTP credentials and a verified email-delivery configuration were not provided. The UI explains this rather than pretending an OTP was sent. To enable it, configure a mail provider, secure OTP storage/expiry/rate limits, and a verified reset workflow.
- Before public/production deployment, add server-side authentication/session or JWT security and role/ownership checks to every application, job-management and resume endpoint. The current app uses the existing frontend role selection and is intended as a local portfolio/demo project, not a production-secure hiring service.
