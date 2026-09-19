import { Channel } from '../types';

export function parseM3UContent(content: string, playlistId: number, playlistName: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentExtInf = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentExtInf = line;
    } else if (!line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://') || line.includes('.m3u8') || line.includes('.ts'))) {
      if (currentExtInf) {
        const tvgIdMatch = currentExtInf.match(/tvg-id="([^"]*)"/i);
        const tvgNameMatch = currentExtInf.match(/tvg-name="([^"]*)"/i);
        const tvgLogoMatch = currentExtInf.match(/tvg-logo="([^"]*)"/i);
        const groupTitleMatch = currentExtInf.match(/group-title="([^"]*)"/i);

        const commaIdx = currentExtInf.lastIndexOf(',');
        const rawName = commaIdx !== -1 ? currentExtInf.substring(commaIdx + 1).trim() : '';
        const name = rawName || (tvgNameMatch ? tvgNameMatch[1] : `Channel ${channels.length + 1}`);

        channels.push({
          id: Math.floor(playlistId * 10000 + channels.length + 1),
          playlistId,
          playlistName,
          name,
          tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
          tvgName: tvgNameMatch ? tvgNameMatch[1] : undefined,
          tvgLogo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
          groupTitle: groupTitleMatch ? groupTitleMatch[1] : 'General',
          streamUrl: line,
          status: 'ACTIVE',
          favorite: false,
        });
        currentExtInf = '';
      }
    }
  }

  return channels;
}
