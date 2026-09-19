package com.streamhub.service;

import com.streamhub.dto.UpdateProfileRequest;
import com.streamhub.dto.UserProfileResponse;
import com.streamhub.entity.User;
import com.streamhub.exception.BadRequestException;
import com.streamhub.exception.ResourceNotFoundException;
import com.streamhub.repository.FavoriteRepository;
import com.streamhub.repository.PlaylistRepository;
import com.streamhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final FavoriteRepository favoriteRepository;
    private final PasswordEncoder passwordEncoder;

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public UserProfileResponse getProfile() {
        User user = getCurrentUser();
        long playlistCount = playlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();
        long favoriteCount = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .playlistCount(playlistCount)
                .favoriteCount(favoriteCount)
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String newUsername = request.getUsername().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                throw new BadRequestException("Username '" + newUsername + "' is already taken");
            }
            user.setUsername(newUsername);
        }

        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BadRequestException("Current password does not match");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        }

        user = userRepository.save(user);
        return getProfile();
    }
}
