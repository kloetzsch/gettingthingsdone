import { GtdStatus } from '../api/models';

export interface EffortOption {
  minutes: number;
  label: string;
}

export interface StatusOption {
  value: GtdStatus;
  label: string;
}

export const STATUS_OPTIONS: ReadonlyArray<StatusOption> = [
  { value: 'Inbox', label: 'Inbox' },
  { value: 'NextAction', label: 'Nächster Schritt' },
  { value: 'WaitingFor', label: 'Wartet auf' },
  { value: 'SomedayMaybe', label: 'Irgendwann' },
  { value: 'Done', label: 'Erledigt' },
];

/** Muss mit Backend.Domain.EffortMinutes.AllowedValues übereinstimmen. */
export const EFFORT_OPTIONS: ReadonlyArray<EffortOption> = [
  { minutes: 5, label: '5 Min' },
  { minutes: 10, label: '10 Min' },
  { minutes: 30, label: '30 Min' },
  { minutes: 60, label: '60 Min' },
  { minutes: 240, label: '4 Std' },
  { minutes: 420, label: '1 Tag' },
];
