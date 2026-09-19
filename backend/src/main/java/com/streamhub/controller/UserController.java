package com.streamhub.controller;

import com.streamhub.dto.ApiResponse;
import com.streamhub.dto.UpdateProfileRequest;
import com.streamhub.dto.UserProfileResponse;
import com.streamhub.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User account profile and settings")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Retrieves account metadata, total playlists and favorites")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        UserProfileResponse profile = userService.getProfile();
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Updates username and/or password")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse updated = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
