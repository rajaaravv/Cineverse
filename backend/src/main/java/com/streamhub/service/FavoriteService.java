package com.streamhub.service;

import com.streamhub.dto.FavoriteResponse;
import com.streamhub.entity.Channel;
import com.streamhub.entity.Favorite;
import com.streamhub.entity.User;
import com.streamhub.exception.BadRequestException;
import com.streamhub.exception.ResourceNotFoundException;
import com.streamhub.repository.ChannelRepository;
import com.streamhub.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ChannelRepository channelRepository;
    private final UserService userService;

    public List<FavoriteResponse> getUserFavorites() {
        User user = userService.getCurrentUser();
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public FavoriteResponse addFavorite(Long channelId) {
        User user = userService.getCurrentUser();
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        if (favoriteRepository.existsByUserIdAndChannelId(user.getId(), channelId)) {
            Favorite existing = favoriteRepository.findByUserIdAndChannelId(user.getId(), channelId).get();
            return mapToResponse(existing);
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .channel(channel)
                .build();

        favorite = favoriteRepository.save(favorite);
        log.info("User {} added channel {} to favorites", user.getUsername(), channel.getName());
        return mapToResponse(favorite);
    }

    @Transactional
    public void removeFavorite(Long channelId) {
        User user = userService.getCurrentUser();
        favoriteRepository.deleteByUserIdAndChannelId(user.getId(), channelId);
        log.info("User {} removed channel {} from favorites", user.getUsername(), channelId);
    }

    public boolean isFavorite(Long channelId) {
        User user = userService.getCurrentUser();
        return favoriteRepository.existsByUserIdAndChannelId(user.getId(), channelId);
    }

    private FavoriteResponse mapToResponse(Favorite fav) {
        Channel c = fav.getChannel();
        return FavoriteResponse.builder()
                .id(fav.getId())
                .channelId(c.getId())
                .channelName(c.getName())
                .tvgLogo(c.getTvgLogo())
                .groupTitle(c.getGroupTitle())
                .streamUrl(c.getStreamUrl())
                .playlistId(c.getPlaylist().getId())
                .playlistName(c.getPlaylist().getName())
                .createdAt(fav.getCreatedAt())
                .build();
    }
}
