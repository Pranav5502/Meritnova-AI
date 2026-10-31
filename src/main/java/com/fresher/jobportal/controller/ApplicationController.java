package com.fresher.jobportal.controller;

import com.fresher.jobportal.model.*;
import com.fresher.jobportal.repository.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
  private final JobApplicationRepository applications;
  private final JobRepository jobs;

  public ApplicationController(JobApplicationRepository applications, JobRepository jobs) {
    this.applications = applications;
    this.jobs = jobs;
  }

  @PostMapping(value="/with-resume", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> applyWithResume(
      @RequestParam("jobId") Long jobId,
      @RequestParam("candidateName") String candidateName,
      @RequestParam("candidateEmail") String candidateEmail,
      @RequestParam("education") String education,
      @RequestParam("resume") MultipartFile resume) throws java.io.IOException {
    if (candidateName == null || candidateName.isBlank() || candidateEmail == null ||
        candidateEmail.isBlank() || education == null || education.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please complete all required fields.");
    }
    if (!candidateEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
    }
    if (resume == null || resume.isEmpty() || resume.getSize() > 5 * 1024 * 1024) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attach a PDF resume up to 5 MB.");
    }
    String n = resume.getOriginalFilename() == null ? "" : resume.getOriginalFilename().toLowerCase(Locale.ROOT);
    if (!n.endsWith(".pdf")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF resumes are accepted.");
    Job job = jobs.findById(jobId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This job no longer exists."));
    String email = candidateEmail.toLowerCase(Locale.ROOT).trim();
    if (applications.existsByJobIdAndCandidateEmail(jobId, email)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied for this job.");
    }
    JobApplication a = new JobApplication();
    a.setJobId(job.getId());
    a.setCandidateName(candidateName.trim());
    a.setCandidateEmail(email);
    a.setEducation(education.trim());
    a.setResumeFileName(resume.getOriginalFilename());
    a.setResumeContentType(MediaType.APPLICATION_PDF_VALUE);
    a.setResumeData(resume.getBytes());
    applications.saveAndFlush(a);
    return view(a);
  }

  @GetMapping("/{id}/resume")
  public ResponseEntity<byte[]> resume(@PathVariable Long id) {
    JobApplication a = applications.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (a.getResumeData() == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No resume attached.");
    String safeName = (a.getResumeFileName() == null ? "resume.pdf" : a.getResumeFileName()).replace("\r", "").replace("\n", "").replace("\"", "");
    return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeName + "\"")
        .body(a.getResumeData());
  }

  @GetMapping
  public List<Map<String,Object>> mine(@RequestParam String email) {
    return applications.findByCandidateEmailOrderByAppliedAtDesc(email.toLowerCase(Locale.ROOT).trim())
        .stream().map(this::view).toList();
  }

  @GetMapping("/recruiter")
  public List<Map<String,Object>> all() {
    return applications.findAll().stream()
        .sorted(Comparator.comparing(JobApplication::getAppliedAt).reversed()).map(this::view).toList();
  }

  @PatchMapping("/{id}/status")
  public Map<String,Object> status(@PathVariable Long id, @RequestBody Map<String,String> body) {
    String value = body.getOrDefault("status", "");
    if (!Set.of("APPLIED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED").contains(value))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid application status.");
    JobApplication a = applications.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));
    a.setStatus(value);
    applications.save(a);
    return view(a);
  }

  private Map<String,Object> view(JobApplication a) {
    Job j = jobs.findById(a.getJobId()).orElse(null);
    Map<String,Object> out = new LinkedHashMap<>();
    out.put("id", a.getId());
    out.put("jobId", a.getJobId());
    out.put("jobTitle", j == null ? "Removed job" : j.getTitle());
    out.put("company", j == null ? "" : j.getCompany());
    out.put("candidateName", a.getCandidateName());
    out.put("candidateEmail", a.getCandidateEmail());
    out.put("education", a.getEducation() == null ? "" : a.getEducation());
    out.put("status", a.getStatus());
    out.put("appliedAt", a.getAppliedAt().toString());
    out.put("resumeFileName", a.getResumeFileName() == null ? "" : a.getResumeFileName());
    out.put("resumeUrl", a.getResumeData() == null ? "" : "/api/applications/" + a.getId() + "/resume");
    return out;
  }
}
