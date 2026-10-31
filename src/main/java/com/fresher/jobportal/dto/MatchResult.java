package com.fresher.jobportal.dto;
import java.util.List;
public record MatchResult(int matchScore, List<String> matchedSkills, List<String> missingSkills, String suggestion) { }
