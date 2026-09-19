package com.streamhub;

import com.streamhub.parser.M3UParserService;
import com.streamhub.parser.ParsedChannel;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class M3UParserServiceTest {

    private final M3UParserService parser = new M3UParserService();

    @Test
    void testParseValidM3U() throws IOException {
        String m3uContent = """
                #EXTM3U
                #EXTINF:-1 tvg-id="cnn.us" tvg-name="CNN HD" tvg-logo="https://example.com/cnn.png" group-title="News",CNN News
                https://stream.example.com/cnn/live.m3u8
                #EXTINF:-1 tvg-id="espn.us" tvg-name="ESPN" tvg-logo="https://example.com/espn.png" group-title="Sports",ESPN USA
                https://stream.example.com/espn/live.m3u8
                """;

        List<ParsedChannel> channels = parser.parse(m3uContent);

        assertEquals(2, channels.size());

        ParsedChannel c1 = channels.get(0);
        assertEquals("CNN News", c1.getName());
        assertEquals("cnn.us", c1.getTvgId());
        assertEquals("CNN HD", c1.getTvgName());
        assertEquals("https://example.com/cnn.png", c1.getTvgLogo());
        assertEquals("News", c1.getGroupTitle());
        assertEquals("https://stream.example.com/cnn/live.m3u8", c1.getStreamUrl());

        ParsedChannel c2 = channels.get(1);
        assertEquals("ESPN USA", c2.getName());
        assertEquals("Sports", c2.getGroupTitle());
    }

    @Test
    void testParseM3UWithMissingAttributes() throws IOException {
        String m3uContent = """
                #EXTM3U
                #EXTINF:-1,Sky Cinema
                https://stream.example.com/sky.m3u8
                """;

        List<ParsedChannel> channels = parser.parse(m3uContent);

        assertEquals(1, channels.size());
        ParsedChannel c = channels.get(0);
        assertEquals("Sky Cinema", c.getName());
        assertEquals("General", c.getGroupTitle());
        assertEquals("https://stream.example.com/sky.m3u8", c.getStreamUrl());
    }

    @Test
    void testParseIgnoresCommentsAndEmptyLines() throws IOException {
        String m3uContent = """
                #EXTM3U
                # Just a comment

                #EXTINF:-1 group-title="Music",MTV
                https://stream.example.com/mtv.m3u8

                """;

        List<ParsedChannel> channels = parser.parse(m3uContent);

        assertEquals(1, channels.size());
        assertEquals("MTV", channels.get(0).getName());
        assertEquals("Music", channels.get(0).getGroupTitle());
    }
}
