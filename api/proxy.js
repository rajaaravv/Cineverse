// Vercel Serverless Function: /proxy
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Extract url parameter, preserving all nested query parameters
  let targetUrl = '';
  const idx = req.url.indexOf('url=');
  if (idx >= 0) {
    const rawVal = req.url.substring(idx + 4);
    try {
      targetUrl = decodeURIComponent(rawVal);
    } catch (_) {
      targetUrl = rawVal;
    }
  } else if (req.query && req.query.url) {
    targetUrl = req.query.url;
  }

  if (!targetUrl) {
    return res.status(400).send('Missing "url" parameter');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const isM3u8 = targetUrl.includes('m3u8') || contentType.toLowerCase().includes('mpegurl');

    if (isM3u8) {
      const text = await upstream.text();
      const baseUri = upstream.url || targetUrl;
      const rewritten = rewriteM3U8(text, baseUri);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      return res.status(200).send(rewritten);
    } else {
      res.setHeader('Content-Type', contentType);
      const arrayBuffer = await upstream.arrayBuffer();
      return res.status(200).send(Buffer.from(arrayBuffer));
    }
  } catch (error) {
    return res.status(502).send(`Stream error: ${error.message}`);
  }
}

function rewriteM3U8(text, baseUri) {
  const lines = text.split(/\r?\n/);
  const result = [];
  const uriRegex = /URI="([^"]+)"/g;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push('');
    } else if (trimmed.startsWith('#')) {
      const replaced = trimmed.replace(uriRegex, (match, p1) => {
        return `URI="${prox(baseUri, p1)}"`;
      });
      result.push(replaced);
    } else {
      result.push(prox(baseUri, trimmed));
    }
  }
  return result.join('\n');
}

function prox(baseUri, ref) {
  try {
    const resolved = new URL(ref.trim(), baseUri).toString();
    return `/proxy?url=${encodeURIComponent(resolved)}`;
  } catch (e) {
    return `/proxy?url=${encodeURIComponent(ref.trim())}`;
  }
}
