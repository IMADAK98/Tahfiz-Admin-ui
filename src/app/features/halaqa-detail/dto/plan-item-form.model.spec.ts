import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import {
  STUDY_PLAN_UNIQUE_ITEM_TYPES,
  addPlanItemTypeSubmitError,
  canAddUniquePlanItem,
  duplicatePlanItemTypeFieldErrors,
  editPlanItemTypeOptions,
  editPlanItemTypeSubmitError,
  isLegacyDuplicatePlanItemType,
  missingPlanItemTypes,
  nextUnusedPlanItemType,
  normalizeStudyPlanItemType,
  planItemTypeOptionsForRow,
} from './plan-item-form.model';

const duplicateKey = HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate;

function disabledTypes(
  rows: readonly { type?: unknown }[] | null | undefined,
  rowIndex: number,
): string[] {
  return planItemTypeOptionsForRow(rows, rowIndex)
    .filter((option) => option.disabled)
    .map((option) => option.value);
}

describe('plan item type uniqueness', () => {
  it('matches the Nest live type set: one HIFZ, TATHBEET, or MURAJAA per plan', () => {
    expect([...STUDY_PLAN_UNIQUE_ITEM_TYPES]).toEqual(['HIFZ', 'TATHBEET', 'MURAJAA']);
    expect(normalizeStudyPlanItemType('HIFZ')).toBe('HIFZ');
    expect(normalizeStudyPlanItemType('TATHBEET')).toBe('TATHBEET');
    expect(normalizeStudyPlanItemType('MURAJAA')).toBe('MURAJAA');
    expect(normalizeStudyPlanItemType(null)).toBeNull();
    expect(normalizeStudyPlanItemType(undefined)).toBeNull();
    expect(normalizeStudyPlanItemType('')).toBeNull();
    expect(normalizeStudyPlanItemType('hifz')).toBeNull();
    expect(normalizeStudyPlanItemType('AUTO')).toBeNull();

    const planA = [{ type: 'HIFZ' }];
    const planB = [{ type: 'HIFZ' }];
    expect(duplicatePlanItemTypeFieldErrors(planA)).toEqual({});
    expect(duplicatePlanItemTypeFieldErrors(planB)).toEqual({});
    expect(duplicatePlanItemTypeFieldErrors([{ type: 'HIFZ' }, { type: 'HIFZ' }])).toEqual({
      'studyPlanItems.0.type': duplicateKey,
      'studyPlanItems.1.type': duplicateKey,
    });
  });

  it('disables a selected type in other rows and keeps it enabled on its own row', () => {
    const rows = [{ type: 'HIFZ' }, { type: 'TATHBEET' }];

    expect(disabledTypes(rows, 0)).toEqual(['TATHBEET']);
    expect(disabledTypes(rows, 1)).toEqual(['HIFZ']);
    expect(planItemTypeOptionsForRow(rows, 0).find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );
    expect(planItemTypeOptionsForRow(rows, 1).find((option) => option.value === 'TATHBEET')?.disabled).toBe(
      false,
    );
  });

  it('frees the previous type when the selection changes', () => {
    const before = [{ type: 'HIFZ' }, { type: 'TATHBEET' }];
    expect(disabledTypes(before, 1)).toContain('HIFZ');

    const after = [{ type: 'MURAJAA' }, { type: 'TATHBEET' }];
    expect(disabledTypes(after, 1)).toEqual(['MURAJAA']);
    expect(disabledTypes(after, 1)).not.toContain('HIFZ');
  });

  it('frees a type when its row is removed', () => {
    const rows = [{ type: 'HIFZ' }, { type: 'TATHBEET' }, { type: 'MURAJAA' }];
    expect(canAddUniquePlanItem(rows)).toBe(false);

    const remaining = rows.slice(0, 2);
    expect(disabledTypes(remaining, 0)).toEqual(['TATHBEET']);
    expect(disabledTypes(remaining, 0)).not.toContain('MURAJAA');
    expect(canAddUniquePlanItem(remaining)).toBe(true);
    expect(nextUnusedPlanItemType(remaining)).toBe('MURAJAA');
  });

  it('disables add only when every valid type is used, then enables it again', () => {
    expect(canAddUniquePlanItem([{ type: 'HIFZ' }])).toBe(true);
    expect(canAddUniquePlanItem([{ type: 'HIFZ' }, { type: 'TATHBEET' }, { type: 'MURAJAA' }])).toBe(
      false,
    );
    expect(nextUnusedPlanItemType([{ type: 'HIFZ' }, { type: 'TATHBEET' }, { type: 'MURAJAA' }])).toBeNull();
    expect(canAddUniquePlanItem([{ type: 'HIFZ' }, { type: 'TATHBEET' }])).toBe(true);
  });

  it('ignores null and unknown types and does not treat them as duplicates', () => {
    const rows = [{ type: null }, { type: undefined }, { type: '' }, { type: 'HIFZ' }];
    expect(disabledTypes(rows, 0)).toEqual(['HIFZ']);
    expect(disabledTypes(rows, 3)).toEqual([]);
    expect(duplicatePlanItemTypeFieldErrors(rows)).toEqual({});
    expect(canAddUniquePlanItem(rows)).toBe(true);
    expect(nextUnusedPlanItemType(rows)).toBe('TATHBEET');
    expect(missingPlanItemTypes(null)).toEqual(['HIFZ', 'TATHBEET', 'MURAJAA']);
  });

  it('flags a programmatic duplicate without dropping either row', () => {
    const rows = [{ type: 'HIFZ' }, { type: 'HIFZ' }];
    expect(planItemTypeOptionsForRow(rows, 0).find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );
    expect(planItemTypeOptionsForRow(rows, 1).find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );
    expect(duplicatePlanItemTypeFieldErrors(rows)).toEqual({
      'studyPlanItems.0.type': duplicateKey,
      'studyPlanItems.1.type': duplicateKey,
    });
    expect(rows).toEqual([{ type: 'HIFZ' }, { type: 'HIFZ' }]);
  });

  it('keeps create and edit option rules aligned, including the initial edit value', () => {
    const siblings = ['HIFZ', 'TATHBEET'];
    expect(editPlanItemTypeOptions(siblings, 'MURAJAA')).toEqual(
      planItemTypeOptionsForRow([{ type: 'HIFZ' }, { type: 'TATHBEET' }, { type: 'MURAJAA' }], 2),
    );
    expect(disabledTypes([{ type: 'HIFZ' }, { type: 'TATHBEET' }, { type: 'MURAJAA' }], 2)).toEqual([
      'HIFZ',
      'TATHBEET',
    ]);
    expect(editPlanItemTypeSubmitError('TATHBEET', 'MURAJAA', siblings)).toBe(duplicateKey);
    expect(editPlanItemTypeSubmitError('MURAJAA', 'MURAJAA', siblings)).toBeNull();
  });

  it('flags a legacy duplicate and still allows the loaded type', () => {
    const siblings = ['HIFZ', 'TATHBEET'];
    expect(isLegacyDuplicatePlanItemType('HIFZ', 'HIFZ', siblings)).toBe(true);
    expect(editPlanItemTypeSubmitError('HIFZ', 'HIFZ', siblings)).toBeNull();
    expect(editPlanItemTypeOptions(siblings, 'HIFZ').find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );
    expect(editPlanItemTypeOptions(siblings, 'HIFZ').find((option) => option.value === 'TATHBEET')?.disabled).toBe(
      true,
    );
    expect(isLegacyDuplicatePlanItemType('MURAJAA', 'HIFZ', siblings)).toBe(false);
    expect(siblings).toEqual(['HIFZ', 'TATHBEET']);
  });

  it('rejects an add-item type that is no longer available', () => {
    expect(addPlanItemTypeSubmitError('TATHBEET', ['TATHBEET', 'MURAJAA'])).toBeNull();
    expect(addPlanItemTypeSubmitError('HIFZ', ['TATHBEET'])).toBe(duplicateKey);
    expect(addPlanItemTypeSubmitError(null, ['TATHBEET'])).toBeNull();
    expect(addPlanItemTypeSubmitError('MURAJAA', [])).toBe(duplicateKey);
  });
});
