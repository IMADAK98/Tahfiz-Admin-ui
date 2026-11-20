/**
 * Admin landing dashboard copy, rev 4.2, verbatim from DASHBOARD-COPY.arabic.md (Thafiz Arabic,
 * including the 2026-11-13 «أداء الحلقات» live-state additions).
 * `{x, plural, …}` blocks are ICU MessageFormat; render with `formatDashboardCopy`.
 */
export const DASHBOARD_COPY = {
  'term.label': 'الدورة الحالية',
  'term.status_active': 'نشطة',
  'term.end_btn': 'إنهاء الدورة',
  'noterm.title': 'لا توجد دورة نشطة',
  'noterm.body':
    'أنشئ دورة، وسيظهر أداء الحلقات هنا بعد أن يبدأ المعلمون بتسجيل الحضور والتقدّم في تطبيق المعلم.',
  'noterm.cta': 'إنشاء دورة',
  'ov.title': 'أداء الحلقات',
  'ov.order_note': 'مرتّبة حسب الدرجة من الأقل إلى الأعلى، فتظهر الحلقات التي تحتاج متابعة أولًا',
  'ov.formula':
    'الدرجة متوسط نسبتَي الحضور وتغطية الخطة المسجّلة منذ بداية الدورة · الغياب بعذر خارج الحضور، وما ليس في الخطة خارج التغطية',
  'ov.link': 'التقارير المفصّلة',
  'ov.col.rank': '#',
  'ov.col.name': 'الحلقة',
  'ov.col.score': 'الدرجة',
  'ov.col.att': 'الحضور',
  'ov.col.cov': 'التغطية',
  'ov.row_meta':
    '{teacher} · {n, plural, zero {لا طلاب} one {طالب واحد} two {طالبان} few {# طلاب} many {# طالبًا} other {# طالب}}',
  'ov.row_aria': '{name}: الدرجة {score}، الحضور {att}، التغطية {cov}. فتح تفاصيل الحلقة',
  'ov.aria_pct': '{v}%',
  'ov.aria_none': 'بلا بيانات بعد',
  'ov.loading': 'جارٍ تحميل الحلقات…',
  'ov.error_title': 'تعذّر تحميل الحلقات',
  'ov.retry': 'إعادة المحاولة',
  'ov.empty': 'لا توجد حلقات نشطة في هذه الدورة.',
  'ov.band.low': 'أقل من 75 — تحتاج اهتمامًا',
  'ov.band.mid': '75–84 — تحتاج متابعة',
  'ov.band.ok': '85 فأكثر',
  'ov.table_aria': 'أداء الحلقات، مرتّبة من الأقل درجةً إلى الأعلى',
  'pc.dash': '—',
  'foot.note':
    'للاطلاع فقط — يُسجَّل الحضور والتقدّم من تطبيق المعلم. نسبة الحضور = (حاضر + متأخر) ÷ (حاضر + متأخر + غائب)، دون الغياب بعذر وأيام العطلة والأيام غير المسجّلة.',
} as const;

export type DashboardCopyKey = keyof typeof DASHBOARD_COPY;

export type DashboardCopyValues = Readonly<Record<string, string | number>>;

const AR_PLURAL_RULES = new Intl.PluralRules('ar');
const PLURAL_MARKER = ', plural,';

function closingBraceIndex(text: string, openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < text.length; index++) {
    if (text[index] === '{') depth++;
    if (text[index] === '}' && --depth === 0) return index;
  }
  return text.length - 1;
}

function pluralBranches(body: string): Record<string, string> {
  const branches: Record<string, string> = {};
  let selector = '';
  let index = 0;
  while (index < body.length) {
    if (body[index] === '{') {
      const end = closingBraceIndex(body, index);
      branches[selector.trim()] = body.slice(index + 1, end);
      selector = '';
      index = end + 1;
    } else {
      selector += body[index++];
    }
  }
  return branches;
}

/** `{name}` interpolation plus ICU `{n, plural, …}` with CLDR Arabic categories (zero/one/two/few/many/other). */
export function formatDashboardCopy(template: string, values: DashboardCopyValues = {}): string {
  let output = '';
  let index = 0;
  while (index < template.length) {
    if (template[index] !== '{') {
      output += template[index++];
      continue;
    }
    const end = closingBraceIndex(template, index);
    const inner = template.slice(index + 1, end);
    const markerIndex = inner.indexOf(PLURAL_MARKER);
    if (markerIndex === -1) {
      const value = values[inner.trim()];
      output += value === undefined ? `{${inner}}` : String(value);
    } else {
      const count = Number(values[inner.slice(0, markerIndex).trim()]);
      const branches = pluralBranches(inner.slice(markerIndex + PLURAL_MARKER.length));
      const branch = branches[AR_PLURAL_RULES.select(count)] ?? branches['other'] ?? '';
      output += formatDashboardCopy(branch.replace(/#/g, String(count)), values);
    }
    index = end + 1;
  }
  return output;
}

export function dashboardCopy(key: DashboardCopyKey, values?: DashboardCopyValues): string {
  return formatDashboardCopy(DASHBOARD_COPY[key], values);
}
