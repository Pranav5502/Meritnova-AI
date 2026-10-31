package com.fresher.jobportal.controller;

import com.fresher.jobportal.dto.*;
import com.fresher.jobportal.model.UserAccount;
import com.fresher.jobportal.repository.UserAccountRepository;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
  private final UserAccountRepository users; private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
  public AuthController(UserAccountRepository users) { this.users = users; }
  @PostMapping("/register") public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest r) {
    if (users.findByEmail(r.email().toLowerCase().trim()).isPresent()) return ResponseEntity.badRequest().body(Map.of("message", "An account already exists with this email."));
    UserAccount u = new UserAccount(); u.setFullName(r.fullName()); u.setEmail(r.email()); u.setRole(r.role()); u.setPasswordHash(encoder.encode(r.password())); users.save(u);
    return ResponseEntity.status(HttpStatus.CREATED).body(profile(u));
  }
  @PostMapping("/login") public ResponseEntity<?> login(@Valid @RequestBody LoginRequest r) {
    return users.findByEmail(r.email().toLowerCase().trim()).filter(u -> encoder.matches(r.password(), u.getPasswordHash()))
      .<ResponseEntity<?>>map(u -> ResponseEntity.ok(profile(u))).orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Incorrect email or password.")));
  }
  @PostMapping("/forgot-password") public Map<String,String> reset(@RequestBody Map<String,String> ignored) { return Map.of("message", "If an account exists, a password-reset link has been prepared. Demo mode: email delivery is not configured."); }
  private Map<String,Object> profile(UserAccount u) { return Map.of("name",u.getFullName(),"email",u.getEmail(),"role",u.getRole()); }
}
