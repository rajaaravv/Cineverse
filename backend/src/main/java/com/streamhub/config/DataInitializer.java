package com.streamhub.config;

import com.streamhub.dto.PlaylistCreateRequest;
import com.streamhub.entity.User;
import com.streamhub.repository.UserRepository;
import com.streamhub.service.PlaylistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlaylistService playlistService;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername("demo")) {
            return;
        }

        log.info("Initializing demo user and sample IPTV playlist...");

        User demoUser = User.builder()
                .username("demo")
                .email("demo@streamhub.io")
                .password(passwordEncoder.encode("demo123"))
                .role("ROLE_USER")
                .build();

        demoUser = userRepository.save(demoUser);

        // Set security context to simulate demo user session during seed
        org.springframework.security.core.userdetails.User principal = new org.springframework.security.core.userdetails.User(
                demoUser.getUsername(),
                demoUser.getPassword(),
                Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        try {
            // Read sample playlist from resources or embedded string
            String sampleM3u = """
                    #EXTM3U
                    #EXTINF:-1 tvg-id="Bloomberg.us" tvg-name="Bloomberg TV" tvg-logo="https://i.imgur.com/8QWvGqA.png" group-title="News",Bloomberg Quicktake
                    https://bloomberg-p2p.live.amagi.tv/hls/amagi_hls_data_bloomberg-p2p-samsungin/CDN/playlist.m3u8
                    #EXTINF:-1 tvg-id="France24.fr" tvg-name="France 24 English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/France_24_logo.svg/512px-France_24_logo.svg.png" group-title="News",France 24 English
                    https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8
                    #EXTINF:-1 tvg-id="DW.de" tvg-name="DW English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/512px-Deutsche_Welle_symbol_2012.svg.png" group-title="News",DW English
                    https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8
                    #EXTINF:-1 tvg-id="RedBullTV.at" tvg-name="Red Bull TV" tvg-logo="https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/512px-Red_Bull_TV_logo.svg.png" group-title="Sports",Red Bull TV
                    https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8
                    #EXTINF:-1 tvg-id="NASA.us" tvg-name="NASA TV Public" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/512px-NASA_logo.svg.png" group-title="Science & Tech",NASA TV Public-Education
                    https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8
                    #EXTINF:-1 tvg-id="AlJazeera.qa" tvg-name="Al Jazeera English" tvg-logo="https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Al_Jazeera_English_logo.svg/512px-Al_Jazeera_English_logo.svg.png" group-title="News",Al Jazeera English
                    https://live-hls-web-aje.getaj.net/AJE/01.m3u8
                    #EXTINF:-1 tvg-id="Euronews.fr" tvg-name="Euronews English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Euronews_logo_2016.svg/512px-Euronews_logo_2016.svg.png" group-title="News",Euronews English
                    https://euronews-euronews-world-1-au.samsung.wurl.tv/playlist.m3u8
                    #EXTINF:-1 tvg-id="Tastemade.us" tvg-name="Tastemade" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Tastemade_logo.svg/512px-Tastemade_logo.svg.png" group-title="Entertainment",Tastemade Food & Travel
                    https://tastemade-samsungus.amagi.tv/playlist.m3u8
                    #EXTINF:-1 tvg-id="BigBuckBunny.org" tvg-name="Big Buck Bunny 24/7" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/360px-Big_buck_bunny_poster_big.jpg" group-title="Movies",Big Buck Bunny Test Stream
                    https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
                    #EXTINF:-1 tvg-id="Sintel.org" tvg-name="Sintel Animated Stream" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/360px-Sintel_poster.jpg" group-title="Movies",Sintel High Definition Stream
                    https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
                    """;

            PlaylistCreateRequest request = new PlaylistCreateRequest();
            request.setName("Global Public News & Entertainment");
            request.setContent(sampleM3u);

            playlistService.createFromRequest(request);
            log.info("Demo user 'demo' created with default sample playlist!");
        } catch (Exception e) {
            log.warn("Could not seed initial demo playlist: {}", e.getMessage());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
