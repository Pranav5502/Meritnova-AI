package com.fresher.jobportal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank private String title;
    @NotBlank private String company;
    @NotBlank private String location;
    @Column(length = 3000) @NotBlank private String description;
    @NotBlank private String skills;
    private String employmentType = "Full-time";
    private Integer openPositions = 1;
    private String salaryPackage = "Not disclosed";
    private String experienceLevel = "Fresher / Entry level";
    public Long getId() { return id; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public String getCompany() { return company; } public void setCompany(String v) { company = v; }
    public String getLocation() { return location; } public void setLocation(String v) { location = v; }
    public String getDescription() { return description; } public void setDescription(String v) { description = v; }
    public String getSkills() { return skills; } public void setSkills(String v) { skills = v; }
    public String getEmploymentType() { return employmentType; } public void setEmploymentType(String v) { employmentType = v; }
    public Integer getOpenPositions() { return openPositions; } public void setOpenPositions(Integer v) { openPositions = v; }
    public String getSalaryPackage() { return salaryPackage; } public void setSalaryPackage(String v) { salaryPackage = v; }
    public String getExperienceLevel() { return experienceLevel; } public void setExperienceLevel(String v) { experienceLevel = v; }
}
