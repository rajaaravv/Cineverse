package com.streamhub.repository;

import com.streamhub.entity.WatchHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    List<WatchHistory> findByUserIdOrderByLastWatchedAtDesc(Long userId, Pageable pageable);
    Optional<WatchHistory> findByUserIdAndChannelId(Long userId, Long channelId);
    void deleteByUserId(Long userId);
}
