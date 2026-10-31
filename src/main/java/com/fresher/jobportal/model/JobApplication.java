package com.fresher.jobportal.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications", uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "candidate_email"}))
public class JobApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "job_id", nullable = false) private Long jobId;
    @Column(nullable = false) private String candidateName;
    @Column(name = "candidate_email", nullable = false) private String candidateEmail;
    @Column(nullable = false) private String status = "APPLIED";
    @Column(nullable = false) private LocalDateTime appliedAt = LocalDateTime.now();
    @Column(length = 180) private String education;
    private String resumeFileName;
    private String resumeContentType;
    @Lob @Column(name = "resume_data", columnDefinition = "LONGBLOB") private byte[] resumeData;
    public Long getId() { return id; }
    public Long getJobId() { return jobId; } public void setJobId(Long v) { jobId = v; }
    public String getCandidateName() { return candidateName; } public void setCandidateName(String v) { candidateName = v; }
    public String getCandidateEmail() { return candidateEmail; } public void setCandidateEmail(String v) { candidateEmail = v.toLowerCase().trim(); }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public String getEducation() { return education; } public void setEducation(String v) { education = v; }
    public String getResumeFileName() { return resumeFileName; } public void setResumeFileName(String v) { resumeFileName = v; }
    public String getResumeContentType() { return resumeContentType; } public void setResumeContentType(String v) { resumeContentType = v; }
    public byte[] getResumeData() { return resumeData; } public void setResumeData(byte[] v) { resumeData = v; }
}
