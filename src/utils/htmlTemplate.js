import fs from 'node:fs';
import path from 'node:path';
import config from '../config/index.js';

function readTemplate(name) {
  const filePath = path.join(config.publicDir, name);
  return fs.readFileSync(filePath, 'utf8');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyOgPlaceholders(html, { ogTitle, ogDescription, ogUrl }) {
  return html
    .replace(/\{\{OG_TITLE\}\}/g, ogTitle)
    .replace(/\{\{OG_DESCRIPTION\}\}/g, ogDescription)
    .replace(/\{\{OG_URL\}\}/g, ogUrl);
}

export function renderLandingHtml(baseUrl) {
  return applyOgPlaceholders(readTemplate('index.html'), {
    ogTitle: 'Kirtan Playlist',
    ogDescription: 'Create a shareable playlist of kirtan lyrics in Unicode.',
    ogUrl: baseUrl,
  });
}

export function renderPlaylistHtml({ slug, baseUrl, title, notFound = false }) {
  const pageUrl = `${baseUrl}/p/${encodeURIComponent(slug)}`;
  const tpl = readTemplate('playlist.html');

  if (notFound) {
    return applyOgPlaceholders(tpl, {
      ogTitle: 'Playlist not found — Kirtan Playlist',
      ogDescription: 'This playlist does not exist or may have been deleted.',
      ogUrl: pageUrl,
    })
      .replace(/\{\{SLUG\}\}/g, escapeHtml(slug))
      .replace(/\{\{NOT_FOUND\}\}/g, 'true')
      .replace(/\{\{PLAYLIST_TITLE\}\}/g, 'Playlist not found');
  }

  const safeTitle = escapeHtml(title || 'Kirtan Playlist');
  const ogTitle = `${safeTitle} — Kirtan Playlist`;
  const ogDescription = `Shared kirtan lyric playlist: ${safeTitle}. Open to view and edit Unicode lyrics.`;

  return applyOgPlaceholders(tpl, {
    ogTitle,
    ogDescription,
    ogUrl: pageUrl,
  })
    .replace(/\{\{SLUG\}\}/g, escapeHtml(slug))
    .replace(/\{\{NOT_FOUND\}\}/g, 'false')
    .replace(/\{\{PLAYLIST_TITLE\}\}/g, safeTitle);
}
