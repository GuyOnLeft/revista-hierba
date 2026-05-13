import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const ACCEPTABLE_LICENSE_PATTERNS = [
  /^public domain/i,
  /^cc\s*0/i,
  /^cc\s*by\s+\d/i,
];

const MIN_LONG_EDGE = 800;
const REJECT_MIMES = new Set(['image/svg+xml']);

function isAcceptableLicense(licenseStr) {
  if (!licenseStr) return false;
  return ACCEPTABLE_LICENSE_PATTERNS.some(rx => rx.test(licenseStr));
}

export function filterCandidates(apiResponse) {
  const pages = apiResponse?.query?.pages || {};
  const results = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (REJECT_MIMES.has(info.mime)) continue;
    const longEdge = Math.max(info.width || 0, info.height || 0);
    if (longEdge < MIN_LONG_EDGE) continue;
    const license = info.extmetadata?.LicenseShortName?.value;
    if (!isAcceptableLicense(license)) continue;
    results.push({
      title: page.title,
      url: info.url,
      width: info.width,
      height: info.height,
      mime: info.mime,
      license,
      artist: info.extmetadata?.Artist?.value || 'Unknown',
      description: info.extmetadata?.ImageDescription?.value || '',
    });
  }
  return results;
}

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export async function searchCommons(terms, perTermLimit = 5, fetchImpl = fetch) {
  const fileTitles = new Set();
  for (const term of terms) {
    const url = new URL(COMMONS_API);
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srnamespace', '6');
    url.searchParams.set('srsearch', term);
    url.searchParams.set('srlimit', String(perTermLimit));
    const resp = await fetchImpl(url, {
      headers: { 'User-Agent': 'RevistaHierba-DailyDraft/1.0 (https://revistahierba.com)' },
    });
    if (!resp.ok) continue;
    const data = await resp.json();
    for (const hit of data.query?.search || []) {
      fileTitles.add(hit.title);
    }
  }
  if (fileTitles.size === 0) return [];

  const titlesParam = [...fileTitles].join('|');
  const infoUrl = new URL(COMMONS_API);
  infoUrl.searchParams.set('action', 'query');
  infoUrl.searchParams.set('format', 'json');
  infoUrl.searchParams.set('titles', titlesParam);
  infoUrl.searchParams.set('prop', 'imageinfo');
  infoUrl.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  const infoResp = await fetchImpl(infoUrl, {
    headers: { 'User-Agent': 'RevistaHierba-DailyDraft/1.0 (https://revistahierba.com)' },
  });
  const info = await infoResp.json();
  return filterCandidates(info);
}

export async function downloadImage(url, destPath, fetchImpl = fetch) {
  await mkdir(dirname(destPath), { recursive: true });
  const resp = await fetchImpl(url, {
    headers: { 'User-Agent': 'RevistaHierba-DailyDraft/1.0 (https://revistahierba.com)' },
  });
  if (!resp.ok) throw new Error(`Download failed: ${resp.status} ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await writeFile(destPath, buf);
  return destPath;
}
