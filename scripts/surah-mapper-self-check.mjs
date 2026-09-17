/** ponytail: live GET /quran/surahs is { id, surahName }; GET /quran/surah/{id} adds ayahs: number[]. */
function surahNumberOf(surah) {
  return surah.number ?? surah.id;
}

function surahNameOf(surah) {
  return surah.surahName ?? surah.arabicName ?? surah.name ?? String(surahNumberOf(surah));
}

function ayahNumbersOf(surah) {
  return Array.isArray(surah.ayahs) ? surah.ayahs : [];
}

function surahSelectLabel(number, name) {
  return `${number} — ${name}`;
}

const live = { id: 1, surahName: 'الفَاتِحة', ayahs: [1, 2, 3, 4, 5, 6, 7] };
const label = surahSelectLabel(surahNumberOf(live), surahNameOf(live));
if (label !== '1 — الفَاتِحة') {
  throw new Error(`surah label: ${label}`);
}
if (ayahNumbersOf(live).join() !== '1,2,3,4,5,6,7') {
  throw new Error('ayah numbers');
}
if (surahNameOf({ id: 2 }) !== '2') {
  throw new Error('name fallback');
}

console.log('surah mapper self-check ok');
