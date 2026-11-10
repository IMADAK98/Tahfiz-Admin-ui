/**
 * Admin landing dashboard copy, rev 4.1, verbatim from DASHBOARD-COPY.arabic.md (Thafiz Arabic).
 * `{x, plural, …}` blocks are ICU MessageFormat; render with `formatDashboardCopy`.
 */
export const DASHBOARD_COPY = {
  'page.title': 'لوحة التحكم',
  'page.subtitle': 'ما يحتاج إلى متابعتك اليوم',
  'page.user': 'مشرف',
  'page.doc_title_suffix': 'تحفيظ',
  'common.sample': 'عيّنة',
  'term.label': 'الدورة الحالية',
  'term.status_active': 'نشطة',
  'term.meta':
    '{start} – {end} · {days, plural, zero {لا أيام دراسية} one {يوم دراسي واحد} two {يومان دراسيان} few {# أيام دراسية} many {# يومًا دراسيًا} other {# يوم دراسي}} حتى اليوم',
  'term.end_btn': 'إنهاء الدورة',
  'noterm.title': 'لا توجد دورة نشطة',
  'noterm.body':
    'يظهر هنا أداء الحلقات وقوائم المتابعة بعد إنشاء دورة، وبدء المعلمين بتسجيل الحضور والتقدّم في تطبيق المعلم.',
  'noterm.cta': 'إنشاء دورة',
  'kpi.halaqat': 'الحلقات النشطة',
  'kpi.halaqat_meta': 'في الدورة الحالية',
  'kpi.teachers': 'المعلمون',
  'kpi.teachers_meta': 'النشطون في المركز',
  'kpi.students': 'الطلاب النشطون',
  'kpi.students_meta': 'في الحلقات النشطة',
  'kpi.requests': 'طلبات تنتظر المراجعة',
  'kpi.requests_meta': 'طلاب {s} · معلمون {t} · إعادة تسجيل {r}',
  'kpi.requests_cta': 'عرض',
  'kpi.requests_aria': 'عرض الطلبات التي تنتظر المراجعة، وعددها {n}',
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
  'ov.row_aria': '{name}: الدرجة {score}، الحضور {att}%، التغطية {cov}%. فتح تفاصيل الحلقة',
  'ov.inc_chip': 'تسجيل غير مكتمل',
  'ov.inc_tip': 'لم يكتمل تسجيل حضور هذه الحلقة هذا الأسبوع، لذا قد تتغيّر الدرجة بعد اكتماله.',
  'ov.band.low': 'أقل من 75 — تحتاج اهتمامًا',
  'ov.band.mid': '75–84 — تحتاج متابعة',
  'ov.band.ok': '85 فأكثر',
  'ov.band.inc': 'لم يكتمل تسجيل الحضور هذا الأسبوع',
  'ov.table_aria': 'أداء الحلقات، مرتّبة من الأقل درجةً إلى الأعلى',
  'wh.title': 'حلقات بحاجة إلى متابعة',
  'wh.sub': 'الأقل درجةً أولًا، بحدّ أقصى 5 حلقات، مع سبب كل منها',
  'reason.att': 'حضور منخفض',
  'reason.cov': 'تغطية منخفضة',
  'reason.inc': 'تسجيل غير مكتمل',
  'reason.score': 'درجة منخفضة',
  'wh.row_aria': '{name}، الدرجة {score}. فتح تفاصيل الحلقة',
  'wh.empty_title': 'لا توجد حلقات بحاجة إلى متابعة الآن.',
  'wh.empty_body':
    'في جميع الحلقات: الدرجة 80 فأكثر، والحضور 85% فأكثر، والتغطية 75% فأكثر، والتسجيل مكتمل.',
  'ws.title': 'طلاب بحاجة إلى متابعة',
  'ws.sub': 'الغياب 3 مرات فأكثر، أو التغطية أقل من 75% · للمتابعة لا للمفاضلة',
  'ws.grp_abs': 'الغياب 3 مرات فأكثر',
  'ws.grp_cov': 'التغطية أقل من 75%',
  'ws.issue_abs': 'غياب {n}',
  'ws.issue_cov': 'تغطية {p}%',
  'ws.more':
    '{n, plural, zero {} one {وآخر في هذه المجموعة} two {وآخران في هذه المجموعة} few {و# آخرون في هذه المجموعة} many {و# آخرون في هذه المجموعة} other {و# آخرون في هذه المجموعة}}',
  'ws.all': 'عرض القائمة كاملة ({n})',
  'ws.row_aria': '{name} ({halaqa}): {issue}. فتح تفاصيل الطالب',
  'ws.empty_title': 'لا يوجد طلاب بحاجة إلى متابعة الآن.',
  'ws.empty_body': 'لم يغب أي طالب 3 مرات فأكثر، ولا تقلّ تغطية أي طالب عن 75%.',
  'mc.title': 'اكتمال تسجيل الحضور هذا الأسبوع',
  'mc.sub':
    '{range} · {days, plural, zero {لا أيام دراسية} one {يوم دراسي واحد} two {يومان دراسيان} few {# أيام دراسية} many {# يومًا دراسيًا} other {# يوم دراسي}} حتى اليوم · يُحسب الغياب بعذر ضمن المسجَّل',
  'mc.days2': 'يومان دراسيان',
  'mc.big':
    '{done} من {all, plural, zero {0 حلقات} one {حلقة واحدة} two {حلقتين} few {# حلقات} many {# حلقة} other {# حلقة}}',
  'mc.big_sub': 'اكتمل تسجيلها هذا الأسبوع',
  'mc.legend_marked': 'مسجَّل {n}',
  'mc.legend_unmarked': 'غير مسجَّل {n}',
  'mc.inc_head': 'حلقات لم يكتمل تسجيلها',
  'mc.inc_row': 'سُجّل {m} من {e} · لم يُسجَّل {u}',
  'mc.ok': 'اكتمل تسجيل الحضور في جميع الحلقات لهذا الأسبوع حتى اليوم.',
  'pc.title': 'تغطية الخطة المسجّلة',
  'pc.sub': 'المتوسط لمن في خطتهم البند فقط · منذ بداية الدورة',
  'type.hifz': 'حفظ',
  'type.tathbeet': 'تثبيت',
  'type.murajaa': 'مراجعة',
  'pc.n':
    '{n, plural, zero {لا يوجد في خطط الدورة} one {طالب واحد في خطته البند} two {طالبان في خطتهما البند} few {# طلاب في خطتهم البند} many {# طالبًا في خطتهم البند} other {# طالب في خطتهم البند}}',
  'pc.na': 'لا يوجد في خطط الدورة',
  'pc.dash': '—',
  'pc.note':
    '«—» يعني أن البند غير موجود في خطط الدورة. التغطية ما سُجّل مقارنةً بالمخطَّط، ولا تقيس الإتقان.',
  'foot.note':
    'للاطلاع فقط — يُسجَّل الحضور والتقدّم من تطبيق المعلم. نسبة الحضور = (حاضر + متأخر) ÷ (حاضر + متأخر + غائب)، دون الغياب بعذر وأيام العطلة والأيام غير المسجّلة.',
  'nav.aria': 'قائمة الإدارة',
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
