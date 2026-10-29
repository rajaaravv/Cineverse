// Vercel Serverless Function: /api/channels
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Extract target URL from query
  let targetUrl = req.query.url;
  if (!targetUrl && req.url) {
    const match = req.url.match(/[?&]url=([^&]+)/);
    if (match) targetUrl = decodeURIComponent(match[1]);
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
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.status(upstream.status).send(`Failed to fetch playlist: ${upstream.statusText}`);
    }

    const text = await upstream.text();
    const channels = parseM3U(text);
    return res.status(200).json(channels);
  } catch (error) {
    return res.status(500).send(`Could not load playlist: ${error.message}`);
  }
}

function parseM3U(text) {
  const list = [];
  const lines = text.split(/\r?\n/);
  let name = null;
  let logo = '';
  let group = 'Other';

  const logoRegex = /tvg-logo="([^"]*)"/;
  const groupRegex = /group-title="([^"]*)"/;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const commaIdx = line.lastIndexOf(',');
      name = commaIdx >= 0 ? line.substring(commaIdx + 1).trim() : 'Unknown';
      const logoMatch = line.match(logoRegex);
      logo = logoMatch ? logoMatch[1] : '';
      const groupMatch = line.match(groupRegex);
      group = (groupMatch && groupMatch[1].trim()) ? groupMatch[1].trim() : 'Other';
    } else if (line && !line.startsWith('#') && name !== null) {
      list.push({ name, url: line, logo, group });
      name = null;
    }
  }
  return list;
}
