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

export function renderLandingHtml(baseUrl) {
  return readTemplate('index.html')
    .replace(/\{\{OG_TITLE\}\}/g, 'Kirtan Playlist')
    .replace(/\{\{OG_DESCRIPTION\}\}/g, 'Create a shareable playlist of kirtan lyrics in Unicode.')
    .replace(/\{\{OG_URL\}\}/g, baseUrl);
}

export function renderPlaylistHtml({ slug, baseUrl, notFound = false }) {
  const pageUrl = `${baseUrl}/p/${encodeURIComponent(slug)}`;
  const tpl = readTemplate('playlist.html');
  if (notFound) {
    return tpl
      .replace(/\{\{OG_TITLE\}\}/g, 'Playlist not found')
      .replace(/\{\{OG_DESCRIPTION\}\}/g, 'This playlist does not exist.')
      .replace(/\{\{OG_URL\}\}/g, pageUrl)
      .replace(/\{\{SLUG\}\}/g, escapeHtml(slug))
      .replace(/\{\{NOT_FOUND\}\}/g, 'true');
  }
  return tpl
    .replace(/\{\{OG_TITLE\}\}/g, 'Kirtan Playlist')
    .replace(/\{\{OG_DESCRIPTION\}\}/g, 'Shared kirtan lyric playlist.')
    .replace(/\{\{OG_URL\}\}/g, pageUrl)
    .replace(/\{\{SLUG\}\}/g, escapeHtml(slug))
    .replace(/\{\{NOT_FOUND\}\}/g, 'false');
}
