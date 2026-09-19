package com.streamhub.controller;

import com.streamhub.dto.ApiResponse;
import com.streamhub.dto.WatchHistoryResponse;
import com.streamhub.service.WatchHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@Tag(name = "Watch History", description = "User watch history tracking and retrieval")
public class HistoryController {

    private final WatchHistoryService watchHistoryService;

    @GetMapping
    @Operation(summary = "Get watch history", description = "Retrieves recently played channels")
    public ResponseEntity<ApiResponse<List<WatchHistoryResponse>>> getHistory(
            @RequestParam(defaultValue = "30") int limit
    ) {
        List<WatchHistoryResponse> history = watchHistoryService.getHistory(limit);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping("/{channelId}")
    @Operation(summary = "Record channel watch", description = "Logs or updates the watch timestamp for a channel")
    public ResponseEntity<ApiResponse<WatchHistoryResponse>> recordWatch(@PathVariable Long channelId) {
        WatchHistoryResponse response = watchHistoryService.recordWatch(channelId);
        return ResponseEntity.ok(ApiResponse.ok("Watch event recorded", response));
    }

    @DeleteMapping
    @Operation(summary = "Clear watch history", description = "Clears all watch history for current user")
    public ResponseEntity<ApiResponse<Void>> clearHistory() {
        watchHistoryService.clearHistory();
        return ResponseEntity.ok(ApiResponse.ok("Watch history cleared", null));
    }
}
