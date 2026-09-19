package com.streamhub.repository;

import com.streamhub.entity.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {

    @Query("SELECT c FROM Channel c WHERE c.playlist.user.id = :userId " +
           "AND (:playlistId IS NULL OR c.playlist.id = :playlistId) " +
           "AND (:groupTitle IS NULL OR LOWER(c.groupTitle) = LOWER(:groupTitle))")
    Page<Channel> findByUserIdAndFilters(@Param("userId") Long userId,
                                         @Param("playlistId") Long playlistId,
                                         @Param("groupTitle") String groupTitle,
                                         Pageable pageable);

    @Query("SELECT c FROM Channel c WHERE c.playlist.user.id = :userId " +
           "AND (:playlistId IS NULL OR c.playlist.id = :playlistId) " +
           "AND (:groupTitle IS NULL OR LOWER(c.groupTitle) = LOWER(:groupTitle)) " +
           "AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(c.groupTitle) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Channel> searchChannels(@Param("userId") Long userId,
                                 @Param("playlistId") Long playlistId,
                                 @Param("groupTitle") String groupTitle,
                                 @Param("query") String query,
                                 Pageable pageable);

    @Query("SELECT c.groupTitle, COUNT(c) FROM Channel c " +
           "WHERE c.playlist.user.id = :userId " +
           "AND (:playlistId IS NULL OR c.playlist.id = :playlistId) " +
           "GROUP BY c.groupTitle ORDER BY COUNT(c) DESC")
    List<Object[]> findCategoryCountsByUserId(@Param("userId") Long userId,
                                              @Param("playlistId") Long playlistId);

    long countByPlaylistId(Long playlistId);

    void deleteByPlaylistId(Long playlistId);
}
