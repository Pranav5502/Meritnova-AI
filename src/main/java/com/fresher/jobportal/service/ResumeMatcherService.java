package com.fresher.jobportal.service;
import com.fresher.jobportal.dto.MatchResult;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class ResumeMatcherService {
 public MatchResult match(String resume, String skills) {
  String text = resume.toLowerCase();
  Set<String> words = Arrays.stream(text.split("[^a-z0-9+#.]+")) .filter(s -> s.length()>1).collect(Collectors.toSet());
  List<String> required = Arrays.stream(skills.toLowerCase().split("[,;\\n]+")) .map(String::trim).filter(s -> !s.isBlank()).distinct().toList();
  List<String> matched = required.stream().filter(s -> words.contains(s) || text.contains(s)).toList();
  List<String> missing = required.stream().filter(s -> !matched.contains(s)).toList();
  int score = required.isEmpty()?0:(int)Math.round(matched.size()*100.0/required.size());
  String suggestion = missing.isEmpty()?"Excellent match. Add relevant project achievements.":"Learn or mention: "+String.join(", ", missing);
  return new MatchResult(score, matched, missing, suggestion);
 }
}
