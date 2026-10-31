package com.fresher.jobportal.controller;
import com.fresher.jobportal.dto.*;
import com.fresher.jobportal.model.Job;
import com.fresher.jobportal.repository.JobRepository;
import com.fresher.jobportal.service.ResumeMatcherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import java.io.IOException;
import java.util.List;
@RestController
@RequestMapping("/api")
public class JobController {
  private final JobRepository jobs; private final ResumeMatcherService matcher;
 public JobController(JobRepository jobs, ResumeMatcherService matcher) { this.jobs=jobs; this.matcher=matcher; }
  @GetMapping("/jobs") public List<Job> all(@RequestParam(required = false) String search) {
    return search == null || search.isBlank() ? jobs.findAll() : jobs.findByTitleContainingIgnoreCaseOrCompanyContainingIgnoreCase(search, search);
  }
  @PostMapping("/jobs") @ResponseStatus(HttpStatus.CREATED) public Job add(@Valid @RequestBody Job job) { return jobs.save(job); }
  @PostMapping("/match") public MatchResult match(@Valid @RequestBody MatchRequest request) { return matcher.match(request.resumeText(), request.jobSkills()); }
  @PostMapping(value = "/match-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public MatchResult matchUpload(@RequestParam("resume") MultipartFile resume, @RequestParam("jobSkills") String jobSkills) {
    if (resume.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a resume file.");
    if (resume.getSize() > 5 * 1024 * 1024) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Resume must be 5 MB or smaller.");
    String name = resume.getOriginalFilename() == null ? "" : resume.getOriginalFilename().toLowerCase();
    try {
      String text;
      if (name.endsWith(".pdf")) { try (PDDocument document = PDDocument.load(resume.getInputStream())) { text = new PDFTextStripper().getText(document); } }
      else if (name.endsWith(".docx")) { try (XWPFDocument document = new XWPFDocument(resume.getInputStream())) { text = document.getParagraphs().stream().map(p -> p.getText()).collect(java.util.stream.Collectors.joining("\n")); } }
      else throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only PDF and DOCX resumes are supported.");
      if (text.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No readable text was found. Upload a text-based PDF or DOCX file.");
      return matcher.match(text, jobSkills);
    } catch (IOException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "We could not read this resume file."); }
  }
  @GetMapping("/dashboard") public java.util.Map<String, Object> dashboard() {
    long totalJobs = jobs.count();
    long companies = jobs.findAll().stream().map(j -> j.getCompany().toLowerCase()).distinct().count();
    int openings = jobs.findAll().stream().map(Job::getOpenPositions).filter(java.util.Objects::nonNull).mapToInt(Integer::intValue).sum();
    return java.util.Map.of("totalJobs", totalJobs, "companies", companies, "openings", openings, "status", "Ready");
  }
}
