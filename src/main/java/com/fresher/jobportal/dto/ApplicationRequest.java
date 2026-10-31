package com.fresher.jobportal.dto;
import jakarta.validation.constraints.*;
public record ApplicationRequest(@NotNull Long jobId, @NotBlank String candidateName, @Email String candidateEmail) { }
