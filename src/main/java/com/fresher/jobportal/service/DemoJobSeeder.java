package com.fresher.jobportal.service;

import com.fresher.jobportal.model.Job;
import com.fresher.jobportal.repository.JobRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

/** Adds clearly-labelled sample opportunities only when the database has no jobs. */
@Component
public class DemoJobSeeder implements CommandLineRunner {
    private final JobRepository jobs;
    public DemoJobSeeder(JobRepository jobs) { this.jobs = jobs; }

    @Override public void run(String... args) {
        java.util.Set<String> existingTitles = jobs.findAll()
                .stream()
                .map(j -> j.getTitle()
                        .trim()
                        .replaceAll("\\s*\\(Demo\\)\\s*$", "")
                        .toLowerCase())
                .collect(java.util.stream.Collectors.toSet());
        List<Job> samples = List.of(
            job("Java Developer", "InnovativeTech Solutions", "Pune, Maharashtra", "Full-time", 3, "₹3–5 LPA ", "Fresher", "Build and maintain Java services; learn from senior engineers.", "Java, OOP, SQL, Spring Boot, REST API"),
            job("Junior Full Stack Developer ", "LaunchPad Digital", "Nagpur, Maharashtra", "Full-time", 2, "₹3–4.5 LPA ", "Fresher / 0–1 year", "Contribute to web application features across frontend and backend.", "Java, HTML, CSS, JavaScript, Spring Boot, MySQL"),
            job("Python Developer ", "CodeNest Labs", "Remote, India", "Remote", 2, "₹3.5–6 LPA ", "Fresher / 0–1 year", "Write readable Python code and work with APIs and databases.", "Python, SQL, REST API, Git"),
            job("Frontend Developer ", "PixelBridge Studio", "Pune, Maharashtra", "Hybrid", 1, "₹3–4 LPA ", "Fresher", "Create accessible, responsive web interfaces with a product team.", "HTML, CSS, JavaScript, React, Git"),
            job("QA Engineer ", "QualityPath Systems", "Hyderabad, Telangana", "Full-time", 2, "₹3–4.5 LPA ", "Fresher", "Support manual testing, test-case writing and defect reporting.", "Manual Testing, SQL, SDLC, STLC, Jira"),
            job("SQL / Data Analyst Trainee ", "DataTrail Analytics", "Bengaluru, Karnataka", "Full-time", 2, "₹3–4 LPA ", "Fresher", "Prepare data, write SQL queries and support dashboard reporting.", "SQL, Excel, Power BI, Data Cleaning"),
            job("Backend Developer Trainee ", "CloudHarbor Tech", "Remote, India", "Remote", 1, "₹3.5–5 LPA ", "Fresher", "Help build backend APIs and database integrations.", "Java, Spring Boot, MySQL, REST API, Git"),
            job("Technical Support Associate ", "SupportSpring Services", "Nagpur, Maharashtra", "Full-time", 3, "₹2.4–3.2 LPA ", "Fresher", "Troubleshoot common software issues and document resolutions.", "Communication, Troubleshooting, SQL Basics, Documentation")
        );
        List<Job> missing = samples.stream()
                .filter(j -> !existingTitles.contains(
                        j.getTitle().trim().toLowerCase()))
                .toList();

        if (!missing.isEmpty()) jobs.saveAll(missing);
    }
    private Job job(String title, String company, String location, String type, int openings, String salary, String experience, String description, String skills) {
        Job j = new Job(); j.setTitle(title); j.setCompany(company); j.setLocation(location); j.setEmploymentType(type);
        j.setOpenPositions(openings); j.setSalaryPackage(salary); j.setExperienceLevel(experience); j.setDescription(description); j.setSkills(skills); return j;
    }
}
