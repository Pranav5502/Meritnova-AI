package com.fresher.jobportal.dto;
import jakarta.validation.constraints.*;
public record LoginRequest(@Email String email, @NotBlank String password) { }
