package com.streamhub.service;

import com.streamhub.dto.PlaylistCreateRequest;
import com.streamhub.dto.PlaylistResponse;
import com.streamhub.dto.PlaylistUpdateRequest;
import com.streamhub.entity.Channel;
import com.streamhub.entity.Playlist;
import com.streamhub.entity.User;
import com.streamhub.exception.BadRequestException;
import com.streamhub.exception.ResourceNotFoundException;
import com.streamhub.parser.M3UParserService;
import com.streamhub.parser.ParsedChannel;
import com.streamhub.repository.ChannelRepository;
import com.streamhub.repository.PlaylistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final ChannelRepository channelRepository;
    private final M3UParserService m3uParserService;
    private final UserService userService;

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    public List<PlaylistResponse> getUserPlaylists() {
        User user = userService.getCurrentUser();
        List<Playlist> playlists = playlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return playlists.stream().map(this::mapToResponse).toList();
    }

    public PlaylistResponse getPlaylistById(Long id) {
        User user = userService.getCurrentUser();
        Playlist playlist = playlistRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));
        return mapToResponse(playlist);
    }

    @Transactional
    public PlaylistResponse createFromRequest(PlaylistCreateRequest request) {
        User user = userService.getCurrentUser();

        List<ParsedChannel> parsedChannels;
        boolean isUrl = false;
        String sourceUrl = null;

        if (request.getUrl() != null && !request.getUrl().trim().isEmpty()) {
            isUrl = true;
            sourceUrl = request.getUrl().trim();
            parsedChannels = fetchAndParseFromUrl(sourceUrl);
        } else if (request.getContent() != null && !request.getContent().trim().isEmpty()) {
            try {
                parsedChannels = m3uParserService.parse(request.getContent());
            } catch (IOException e) {
                throw new BadRequestException("Failed to parse M3U content: " + e.getMessage());
            }
        } else {
            throw new BadRequestException("Either playlist URL or M3U content must be provided");
        }

        if (parsedChannels.isEmpty()) {
            throw new BadRequestException("The provided M3U contains no valid playable channels");
        }

        Playlist playlist = Playlist.builder()
                .user(user)
                .name(request.getName().trim())
                .sourceUrl(sourceUrl)
                .isUrl(isUrl)
                .channelCount(parsedChannels.size())
                .build();

        playlist = playlistRepository.save(playlist);

        saveChannelsForPlaylist(playlist, parsedChannels);

        log.info("Saved playlist '{}' with {} channels for user {}", playlist.getName(), parsedChannels.size(), user.getUsername());
        return mapToResponse(playlist);
    }

    @Transactional
    public PlaylistResponse createFromFile(String name, MultipartFile file) {
        User user = userService.getCurrentUser();

        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        List<ParsedChannel> parsedChannels;
        try (InputStream is = file.getInputStream()) {
            parsedChannels = m3uParserService.parse(is);
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file: " + e.getMessage());
        }

        if (parsedChannels.isEmpty()) {
            throw new BadRequestException("The uploaded M3U contains no valid playable channels");
        }

        String playlistName = (name != null && !name.trim().isEmpty()) 
                ? name.trim() 
                : file.getOriginalFilename() != null 
                    ? file.getOriginalFilename().replaceFirst("[.][^.]+$", "") 
                    : "Imported Playlist";

        Playlist playlist = Playlist.builder()
                .user(user)
                .name(playlistName)
                .sourceUrl(null)
                .isUrl(false)
                .channelCount(parsedChannels.size())
                .build();

        playlist = playlistRepository.save(playlist);

        saveChannelsForPlaylist(playlist, parsedChannels);

        log.info("Uploaded and saved playlist '{}' with {} channels", playlist.getName(), parsedChannels.size());
        return mapToResponse(playlist);
    }

    @Transactional
    public PlaylistResponse refreshPlaylist(Long id) {
        User user = userService.getCurrentUser();
        Playlist playlist = playlistRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));

        if (!Boolean.TRUE.equals(playlist.getIsUrl()) || playlist.getSourceUrl() == null) {
            throw new BadRequestException("Cannot refresh a playlist that was uploaded as a file");
        }

        List<ParsedChannel> parsedChannels = fetchAndParseFromUrl(playlist.getSourceUrl());
        if (parsedChannels.isEmpty()) {
            throw new BadRequestException("Failed to refresh: source URL returned no valid channels");
        }

        // Delete existing channels for this playlist
        channelRepository.deleteByPlaylistId(playlist.getId());

        // Re-save newly fetched channels
        saveChannelsForPlaylist(playlist, parsedChannels);
        playlist.setChannelCount(parsedChannels.size());
        playlist = playlistRepository.save(playlist);

        log.info("Refreshed playlist '{}' with {} channels", playlist.getName(), parsedChannels.size());
        return mapToResponse(playlist);
    }

    @Transactional
    public PlaylistResponse updatePlaylist(Long id, PlaylistUpdateRequest request) {
        User user = userService.getCurrentUser();
        Playlist playlist = playlistRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));

        playlist.setName(request.getName().trim());
        playlist = playlistRepository.save(playlist);
        return mapToResponse(playlist);
    }

    @Transactional
    public void deletePlaylist(Long id) {
        User user = userService.getCurrentUser();
        Playlist playlist = playlistRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));

        channelRepository.deleteByPlaylistId(playlist.getId());
        playlistRepository.delete(playlist);
        log.info("Deleted playlist id {} for user {}", id, user.getUsername());
    }

    private List<ParsedChannel> fetchAndParseFromUrl(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            HttpResponse<InputStream> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() != 200) {
                throw new BadRequestException("Failed to download M3U playlist from URL. HTTP status: " + response.statusCode());
            }

            return m3uParserService.parse(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("M3U fetch request was interrupted");
        } catch (IOException e) {
            log.error("Error fetching M3U from URL: {}", url, e);
            throw new BadRequestException("Could not connect to playlist URL: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid playlist URL: " + e.getMessage());
        }
    }

    private void saveChannelsForPlaylist(Playlist playlist, List<ParsedChannel> parsedChannels) {
        List<Channel> channels = new ArrayList<>(parsedChannels.size());
        for (ParsedChannel pc : parsedChannels) {
            channels.add(Channel.builder()
                    .playlist(playlist)
                    .name(pc.getName())
                    .tvgId(pc.getTvgId())
                    .tvgName(pc.getTvgName())
                    .tvgLogo(pc.getTvgLogo())
                    .groupTitle(pc.getGroupTitle())
                    .streamUrl(pc.getStreamUrl())
                    .status("ACTIVE")
                    .build());
        }
        channelRepository.saveAll(channels);
    }

    private PlaylistResponse mapToResponse(Playlist playlist) {
        return PlaylistResponse.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .sourceUrl(playlist.getSourceUrl())
                .isUrl(playlist.getIsUrl())
                .channelCount(playlist.getChannelCount())
                .createdAt(playlist.getCreatedAt())
                .updatedAt(playlist.getUpdatedAt())
                .build();
    }
}
