package com.streamhub.repository;

import com.streamhub.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndChannelId(Long userId, Long channelId);
    boolean existsByUserIdAndChannelId(Long userId, Long channelId);
    void deleteByUserIdAndChannelId(Long userId, Long channelId);
}
