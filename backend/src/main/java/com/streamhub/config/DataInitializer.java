package com.streamhub.config;

import com.streamhub.entity.User;
import com.streamhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername("demo")) {
            return;
        }

        log.info("Initializing demo user and sample IPTV playlist...");

        User demoUser = User.builder()
                .username("demo")
                .email("demo@streamhub.io")
                .password(passwordEncoder.encode("demo123"))
                .role("ROLE_USER")
                .build();

        demoUser = userRepository.save(demoUser);

        // Set security context to simulate demo user session during seed
        org.springframework.security.core.userdetails.User principal = new org.springframework.security.core.userdetails.User(
                demoUser.getUsername(),
                demoUser.getPassword(),
                Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        log.info("Demo user 'demo' created without sample playlists.");
    }
}
