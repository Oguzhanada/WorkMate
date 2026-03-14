import type { AccountRole } from '../RoleSelector';

export type SignUpFormData = {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  county: string;
  city: string;
  eircode: string;
  address1: string;
  address2: string;
  password: string;
  confirmPassword: string;
  identityConsent: boolean;
  referralCode: string;
};

export type FieldErrors = Partial<Record<keyof SignUpFormData, string>>;

export type EircodeStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export type EircodeSuggestion = {
  line1: string | null;
  line2: string | null;
  postTown: string | null;
  county: string | null;
};

export type SignUpDraft = {
  role: AccountRole;
  form: SignUpFormData;
  eircodeStatus: EircodeStatus;
};

export const INITIAL_FORM: SignUpFormData = {
  fullName: '',
  username: '',
  phone: '+353',
  city: '',
  county: '',
  email: '',
  eircode: '',
  address1: '',
  address2: '',
  password: '',
  confirmPassword: '',
  identityConsent: false,
  referralCode: '',
};

export const SIGNUP_DRAFT_KEY = 'workmate.signup.draft.v1';
export const AUTH_TIMEOUT_MS = 15000;
export const AUTH_PING_TIMEOUT_MS = 5000;
