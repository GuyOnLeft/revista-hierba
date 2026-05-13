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
