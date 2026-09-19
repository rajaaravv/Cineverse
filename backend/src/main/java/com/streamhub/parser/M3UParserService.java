package com.streamhub.parser;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class M3UParserService {

    private static final Pattern TVG_ID_PATTERN = Pattern.compile("tvg-id=[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern TVG_NAME_PATTERN = Pattern.compile("tvg-name=[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern TVG_LOGO_PATTERN = Pattern.compile("tvg-logo=[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern GROUP_TITLE_PATTERN = Pattern.compile("group-title=[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);

    /**
     * Parses M3U content from an InputStream.
     */
    public List<ParsedChannel> parse(InputStream inputStream) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            return parseReader(reader);
        }
    }

    /**
     * Parses M3U content from a String.
     */
    public List<ParsedChannel> parse(String content) throws IOException {
        try (BufferedReader reader = new BufferedReader(new StringReader(content))) {
            return parseReader(reader);
        }
    }

    private List<ParsedChannel> parseReader(BufferedReader reader) throws IOException {
        List<ParsedChannel> channels = new ArrayList<>();
        String line;
        ParsedChannel currentChannel = null;

        while ((line = reader.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) {
                continue;
            }

            if (line.startsWith("#EXTINF:")) {
                currentChannel = parseExtInfLine(line);
            } else if (!line.startsWith("#") && currentChannel != null) {
                // This line is the stream URL
                currentChannel.setStreamUrl(line);
                if (isValidChannel(currentChannel)) {
                    channels.add(currentChannel);
                }
                currentChannel = null;
            }
        }

        log.info("Successfully parsed {} channels from M3U input", channels.size());
        return channels;
    }

    private ParsedChannel parseExtInfLine(String line) {
        String tvgId = extractPattern(TVG_ID_PATTERN, line);
        String tvgName = extractPattern(TVG_NAME_PATTERN, line);
        String tvgLogo = extractPattern(TVG_LOGO_PATTERN, line);
        String groupTitle = extractPattern(GROUP_TITLE_PATTERN, line);

        if (groupTitle == null || groupTitle.trim().isEmpty()) {
            groupTitle = "General";
        }

        // Extract channel name (everything after the last comma on #EXTINF line)
        String name = "Unknown Channel";
        int lastCommaIdx = line.lastIndexOf(',');
        if (lastCommaIdx != -1 && lastCommaIdx < line.length() - 1) {
            name = line.substring(lastCommaIdx + 1).trim();
        } else if (tvgName != null && !tvgName.trim().isEmpty()) {
            name = tvgName.trim();
        }

        return ParsedChannel.builder()
                .name(name)
                .tvgId(tvgId)
                .tvgName(tvgName)
                .tvgLogo(tvgLogo)
                .groupTitle(groupTitle.trim())
                .build();
    }

    private String extractPattern(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private boolean isValidChannel(ParsedChannel channel) {
        return channel != null 
                && channel.getStreamUrl() != null 
                && !channel.getStreamUrl().trim().isEmpty()
                && (channel.getStreamUrl().startsWith("http://") 
                    || channel.getStreamUrl().startsWith("https://") 
                    || channel.getStreamUrl().startsWith("rtmp://")
                    || channel.getStreamUrl().startsWith("rtsp://"));
    }
}
