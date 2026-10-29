import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.regex.*;

/**
 * Cineverse - IPTV website. Java backend + HTML/CSS/JS frontend (in the "web" folder).
 * Run from this folder:   java CineverseServer.java      then open http://localhost:9090
 */
public class CineverseServer {

    static final HttpClient client = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    static final Path WEB = Path.of("web").toAbsolutePath().normalize();

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(9090), 0);

        // Static files: index.html, style.css, app.js
        server.createContext("/", e -> {
            String p = e.getRequestURI().getPath();
            if (p.equals("/")) p = "/index.html";
            Path f = WEB.resolve(p.substring(1)).normalize();
            if (!f.startsWith(WEB) || !Files.isRegularFile(f)) {
                send(e, 404, "text/plain", "Not found".getBytes());
                return;
            }
            send(e, 200, mime(f.toString()), Files.readAllBytes(f));
        });

        // API: download + parse playlist -> JSON
        server.createContext("/api/channels", e -> {
            e.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            e.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            e.getResponseHeaders().set("Access-Control-Allow-Headers", "*");
            if ("OPTIONS".equalsIgnoreCase(e.getRequestMethod())) {
                send(e, 204, "text/plain", new byte[0]);
                return;
            }
            try {
                String body = client.send(req(param(e)), HttpResponse.BodyHandlers.ofString()).body();
                send(e, 200, "application/json; charset=utf-8",
                        toJson(parseM3U(body)).getBytes(StandardCharsets.UTF_8));
            } catch (Exception ex) {
                send(e, 500, "text/plain", ("Could not load playlist: " + ex.getMessage()).getBytes());
            }
        });

        // Proxy: relays streams (fixes CORS) and rewrites .m3u8 links
        server.createContext("/proxy", e -> {
            e.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            e.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            e.getResponseHeaders().set("Access-Control-Allow-Headers", "*");
            if ("OPTIONS".equalsIgnoreCase(e.getRequestMethod())) {
                send(e, 204, "text/plain", new byte[0]);
                return;
            }
            try {
                String url = param(e);
                if (url.isEmpty()) {
                    send(e, 400, "text/plain", "Missing 'url' parameter".getBytes());
                    return;
                }
                HttpResponse<byte[]> res = client.send(req(url), HttpResponse.BodyHandlers.ofByteArray());
                String ct = res.headers().firstValue("Content-Type").orElse("application/octet-stream");
                byte[] data = res.body();
                boolean isM3u8 = url.contains("m3u8") || ct.toLowerCase().contains("mpegurl");
                if (isM3u8) {
                    data = rewrite(new String(data, StandardCharsets.UTF_8), res.uri())
                            .getBytes(StandardCharsets.UTF_8);
                    ct = "application/vnd.apple.mpegurl";
                }
                send(e, 200, ct, data);
            } catch (Exception ex) {
                send(e, 502, "text/plain", ("Stream error: " + ex.getMessage()).getBytes());
            }
        });

        server.start();
        System.out.println("Cineverse running -> http://localhost:9090  (serving " + WEB + ")");
    }

    // ---------- helpers ----------
    static String mime(String name) {
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    static HttpRequest req(String url) {
        URI uri;
        try {
            uri = URI.create(url);
        } catch (Exception e) {
            try {
                uri = URI.create(url.replace(" ", "%20"));
            } catch (Exception ex) {
                uri = URI.create(URLEncoder.encode(url, StandardCharsets.UTF_8));
            }
        }
        return HttpRequest.newBuilder(uri)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .header("Accept", "*/*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Connection", "keep-alive")
                .timeout(Duration.ofSeconds(12))
                .build();
    }

    static String param(HttpExchange e) {
        String q = e.getRequestURI().getRawQuery();
        if (q == null || q.isEmpty()) return "";
        int idx = q.indexOf("url=");
        if (idx >= 0) {
            String rawVal = q.substring(idx + 4);
            try {
                return URLDecoder.decode(rawVal, StandardCharsets.UTF_8);
            } catch (Exception ex) {
                return rawVal;
            }
        }
        return "";
    }

    static void send(HttpExchange e, int code, String type, byte[] b) throws IOException {
        e.getResponseHeaders().set("Content-Type", type);
        e.sendResponseHeaders(code, b.length == 0 ? -1 : b.length);
        try (OutputStream os = e.getResponseBody()) { if (b.length > 0) os.write(b); }
    }

    // ---------- M3U parser ----------
    static List<String[]> parseM3U(String text) {
        List<String[]> list = new ArrayList<>();
        Pattern logo = Pattern.compile("tvg-logo=\"([^\"]*)\"");
        Pattern group = Pattern.compile("group-title=\"([^\"]*)\"");
        String name = null, lg = "", grp = "Other";
        for (String line : text.split("\\r?\\n")) {
            line = line.trim();
            if (line.startsWith("#EXTINF")) {
                int c = line.lastIndexOf(',');
                name = c >= 0 ? line.substring(c + 1).trim() : "Unknown";
                Matcher m = logo.matcher(line);  lg = m.find() ? m.group(1) : "";
                m = group.matcher(line);         grp = m.find() && !m.group(1).isBlank() ? m.group(1) : "Other";
            } else if (!line.isEmpty() && !line.startsWith("#") && name != null) {
                list.add(new String[]{name, line, lg, grp});
                name = null;
            }
        }
        return list;
    }

    static String toJson(List<String[]> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            String[] c = list.get(i);
            if (i > 0) sb.append(",");
            sb.append("{\"name\":\"").append(esc(c[0])).append("\",\"url\":\"").append(esc(c[1]))
              .append("\",\"logo\":\"").append(esc(c[2])).append("\",\"group\":\"").append(esc(c[3])).append("\"}");
        }
        return sb.append("]").toString();
    }

    static String esc(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replaceAll("[\\x00-\\x1f]", " ");
    }

    // ---------- proxy: rewrite .m3u8 so segments also go through /proxy ----------
    static String rewrite(String txt, URI base) {
        StringBuilder sb = new StringBuilder();
        Pattern uri = Pattern.compile("URI=\"([^\"]+)\"");
        for (String line : txt.split("\\r?\\n")) {
            String t = line.trim();
            if (t.isEmpty()) {
                sb.append("\n");
            } else if (t.startsWith("#")) {
                Matcher m = uri.matcher(t);
                if (m.find()) {
                    sb.append(m.replaceAll(r -> "URI=\"" + Matcher.quoteReplacement(prox(base, r.group(1))) + "\"")).append("\n");
                } else {
                    sb.append(t).append("\n");
                }
            } else {
                sb.append(prox(base, t)).append("\n");
            }
        }
        return sb.toString();
    }

    static String prox(URI base, String ref) {
        try {
            URI resolved;
            try {
                resolved = base.resolve(ref.trim());
            } catch (Exception e) {
                resolved = base.resolve(ref.trim().replace(" ", "%20"));
            }
            return "/proxy?url=" + URLEncoder.encode(resolved.toString(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "/proxy?url=" + URLEncoder.encode(ref.trim(), StandardCharsets.UTF_8);
        }
    }
}
