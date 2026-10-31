package com.fresher.jobportal.dto;
import jakarta.validation.constraints.NotBlank;
public record MatchRequest(@NotBlank String resumeText, @NotBlank String jobSkills) { }
