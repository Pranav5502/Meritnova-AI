package com.fresher.jobportal.dto;
import jakarta.validation.constraints.*;
public record RegisterRequest(@NotBlank String fullName, @Email String email, @Pattern(regexp="CANDIDATE|RECRUITER") String role, @Size(min=6) String password) { }
