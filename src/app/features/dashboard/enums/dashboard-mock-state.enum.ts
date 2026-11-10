/** `?mock=` values for the landing dashboard fixtures. Anything else falls back to Populated. */
export enum DashboardMockState {
  Populated = 'populated',
  IncompleteMarking = 'incomplete-marking',
  MissingType = 'missing-type',
  EmptyWorklists = 'empty-worklists',
  NoTerm = 'noterm',
}

const MOCK_STATES = new Set<string>(Object.values(DashboardMockState));

export function parseDashboardMockState(value: string | null | undefined): DashboardMockState {
  return value && MOCK_STATES.has(value)
    ? (value as DashboardMockState)
    : DashboardMockState.Populated;
}
