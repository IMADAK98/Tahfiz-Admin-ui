# Angular FE contract — Attendance weekly table (screen 13)

**Nest truth:** `localization-refactor` @ `5fa08515`, live on `tahfiz.onrender.com` (Nest #40).  
**Admin Option 2:** `GET /attendance/weekly-table?weekStartDate=YYYY-MM-DD&halqaId?`  
Omit or blank `halqaId` → every active ḥalaqa in the caller center, including ḥalaqāt whose term is not active (same set as `GET /halqa/dropdown`). Top-level `halqa` is `null`; each student row has `halqa: { id, name }`; server sorts by ḥalaqa name then student name.  
Set `halqaId` → that ḥalaqa only. Top-level `halqa` is `{ id, name }`. Student rows omit `halqa` (same shape as the per-ḥalaqa route).  
Filter list: `GET /halqa/dropdown` → `{ id, name, category }[]`. Path constant: `CENTER_WEEKLY_TABLE_PATH`. Do not fan out the per-ḥalaqa route. Do not narrow all-active to the active term.  
**Per-ḥalaqa endpoint (still live):** `GET /attendance/halqa/{halqaId}/weekly-table?weekStartDate=YYYY-MM-DD`  
**Week start:** must be **Sunday** (Saudi Sun–Thu). Optional `studentId` for single-row drill-down on the per-ḥalaqa route.

Bearer required. Admin web = **read-only** grid. Writes = teacher mobile `POST/PUT /attendance/bulk` (out of this screen).

---

## Response shape (`data`) — live prove

```json
{
  "halqa": { "id": 12, "name": "…" },
  "weekStartDate": "2026-09-13T00:00:00.000Z",
  "weekEndDate": "2026-09-17T00:00:00.000Z",
  "columns": [
    { "dayOfWeek": "Sunday", "date": "2026-09-13", "termDayId": 105, "isHoliday": false }
  ],
  "students": [
    {
      "student": { "id": 26, "name": "…", "email": "…" },
      "days": [
        {
          "termDayId": 105,
          "date": "2026-09-13",
          "dayOfWeek": "Sunday",
          "isHoliday": false,
          "status": "ABSENT"
        }
      ]
    }
  ]
}
```

Envelope: `{ status, message, data }`. Coerce `halqa.id` / `student.id` / `termDayId` string→number.

### Row / column field names only

| Path | Fields |
|---|---|
| `data.halqa` | `id`, `name` |
| `data.weekStartDate`, `data.weekEndDate` | ISO strings |
| `data.columns[]` | `dayOfWeek`, `date`, `termDayId`, `isHoliday` |
| `data.students[]` | `student` + `days` |
| `data.students[].student` | `id`, `name`, `email` |
| `data.students[].days[]` | `termDayId`, `date`, `dayOfWeek`, `isHoliday`, `status` |

Empty / no marks: students still listed with `status: NOT_MARKED` (unlike aggregated, which can return `students: []`). Empty copy: «لا علامات حضور بعد» — not «لا يوجد طلاب».

---

## `status` enums (Nest — exact)

`PRESENT` · `ABSENT` · `LEAVE` · `LATE` · `NOT_MARKED` · `HOLIDAY`

**There is no `EXCUSED` in Nest OpenAPI / mark-proof.**

| UI (ar) | Nest `status` |
|---|---|
| حاضر | `PRESENT` |
| غائب | `ABSENT` |
| متأخر | `LATE` |
| إجازة | `LEAVE` |
| معذور | **`LEAVE`** (not a separate enum — do **not** invent `EXCUSED`) |
| blank / unmarked | `NOT_MARKED` |
| holiday column | `HOLIDAY` and/or `columns[].isHoliday` |

---

## CSV

**No Nest CSV/export endpoint** in OpenAPI for weekly attendance.  
CSV (if product wants it) = **FE-only** from `weekly-table` `data` (build client-side). Do not call a fake `/attendance/.../export`.

---

## Roles

| Actor | weekly-table |
|---|---|
| ADMIN / SYSTEM_ADMIN | ✅ center ḥalaqa read (web report) |
| TEACHER | ✅ intended on **assigned** ḥalaqa only (mobile + any read); live historically allowed unassigned read (authz hole — FE still should not offer unassigned) |
| Public | ❌ |

Ḥalaqa filter source: `GET /halqa/by-term/{termId}` (empty → 200 `[]`).

---

## FE checklist

1. Always send Sunday `weekStartDate`.  
2. Map status with table above; **معذور → `LEAVE`**.  
3. Prefer weekly-table over aggregated for the day grid.  
4. No Nest CSV — FE export only if Designer/Imad asks.  
5. Shared filters with progress report (ḥalaqa + week/range + search).
