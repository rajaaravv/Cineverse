package com.streamhub.service;

import com.streamhub.dto.CategoryResponse;
import com.streamhub.dto.ChannelResponse;
import com.streamhub.entity.Channel;
import com.streamhub.entity.User;
import com.streamhub.exception.ResourceNotFoundException;
import com.streamhub.repository.ChannelRepository;
import com.streamhub.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final FavoriteRepository favoriteRepository;
    private final UserService userService;

    public Page<ChannelResponse> getChannels(Long playlistId, String groupTitle, int page, int size, String sortBy, String sortDir) {
        User user = userService.getCurrentUser();

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Channel> channels = channelRepository.findByUserIdAndFilters(user.getId(), playlistId, groupTitle, pageable);
        return mapChannelPage(user.getId(), channels);
    }

    public Page<ChannelResponse> searchChannels(Long playlistId, String groupTitle, String query, int page, int size, String sortBy, String sortDir) {
        User user = userService.getCurrentUser();

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Channel> channels = channelRepository.searchChannels(user.getId(), playlistId, groupTitle, query != null ? query.trim() : "", pageable);
        return mapChannelPage(user.getId(), channels);
    }

    public ChannelResponse getChannelById(Long channelId) {
        User user = userService.getCurrentUser();
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        if (!channel.getPlaylist().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Channel not found with id: " + channelId);
        }

        boolean isFavorite = favoriteRepository.existsByUserIdAndChannelId(user.getId(), channelId);
        return mapToResponse(channel, isFavorite);
    }

    public List<CategoryResponse> getCategories(Long playlistId) {
        User user = userService.getCurrentUser();
        List<Object[]> rawCategories = channelRepository.findCategoryCountsByUserId(user.getId(), playlistId);

        List<CategoryResponse> categories = new ArrayList<>();
        for (Object[] row : rawCategories) {
            String categoryName = (String) row[0];
            Long count = (Long) row[1];
            categories.add(CategoryResponse.builder()
                    .name(categoryName != null ? categoryName : "General")
                    .channelCount(count != null ? count : 0)
                    .build());
        }
        return categories;
    }

    private Page<ChannelResponse> mapChannelPage(Long userId, Page<Channel> channelPage) {
        List<Long> channelIds = channelPage.getContent().stream().map(Channel::getId).toList();
        Set<Long> favoriteIds = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(fav -> fav.getChannel().getId())
                .collect(Collectors.toSet());

        return channelPage.map(c -> mapToResponse(c, favoriteIds.contains(c.getId())));
    }

    private ChannelResponse mapToResponse(Channel c, boolean isFavorite) {
        return ChannelResponse.builder()
                .id(c.getId())
                .playlistId(c.getPlaylist().getId())
                .playlistName(c.getPlaylist().getName())
                .name(c.getName())
                .tvgId(c.getTvgId())
                .tvgName(c.getTvgName())
                .tvgLogo(c.getTvgLogo())
                .groupTitle(c.getGroupTitle())
                .streamUrl(c.getStreamUrl())
                .status(c.getStatus())
                .favorite(isFavorite)
                .build();
    }
}
