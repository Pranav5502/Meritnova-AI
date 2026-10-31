package com.fresher.jobportal.repository;
import com.fresher.jobportal.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByCandidateEmailOrderByAppliedAtDesc(String email);
    boolean existsByJobIdAndCandidateEmail(Long jobId, String email);
}
