package com.streamhub.service;

import com.streamhub.dto.WatchHistoryResponse;
import com.streamhub.entity.Channel;
import com.streamhub.entity.User;
import com.streamhub.entity.WatchHistory;
import com.streamhub.exception.ResourceNotFoundException;
import com.streamhub.repository.ChannelRepository;
import com.streamhub.repository.WatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WatchHistoryService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final ChannelRepository channelRepository;
    private final UserService userService;

    public List<WatchHistoryResponse> getHistory(int limit) {
        User user = userService.getCurrentUser();
        return watchHistoryRepository.findByUserIdOrderByLastWatchedAtDesc(user.getId(), PageRequest.of(0, Math.min(limit, 100)))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public WatchHistoryResponse recordWatch(Long channelId) {
        User user = userService.getCurrentUser();
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        Optional<WatchHistory> existing = watchHistoryRepository.findByUserIdAndChannelId(user.getId(), channelId);
        WatchHistory history;

        if (existing.isPresent()) {
            history = existing.get();
            history.setLastWatchedAt(LocalDateTime.now());
        } else {
            history = WatchHistory.builder()
                    .user(user)
                    .channel(channel)
                    .lastWatchedAt(LocalDateTime.now())
                    .build();
        }

        history = watchHistoryRepository.save(history);
        return mapToResponse(history);
    }

    @Transactional
    public void clearHistory() {
        User user = userService.getCurrentUser();
        watchHistoryRepository.deleteByUserId(user.getId());
        log.info("Cleared watch history for user {}", user.getUsername());
    }

    private WatchHistoryResponse mapToResponse(WatchHistory h) {
        Channel c = h.getChannel();
        return WatchHistoryResponse.builder()
                .id(h.getId())
                .channelId(c.getId())
                .channelName(c.getName())
                .tvgLogo(c.getTvgLogo())
                .groupTitle(c.getGroupTitle())
                .streamUrl(c.getStreamUrl())
                .playlistId(c.getPlaylist().getId())
                .playlistName(c.getPlaylist().getName())
                .lastWatchedAt(h.getLastWatchedAt())
                .build();
    }
}
