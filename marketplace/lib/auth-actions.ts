'use server';

import {z} from 'zod';

import {setAuthCookie} from '@/lib/security/cookies';

export type AuthFormState = {
  status: 'idle' | 'success' | 'error';
  code?:
    | 'invalid_email'
    | 'short_password'
    | 'required'
    | 'services_required'
    | 'success_customer'
    | 'success_provider'
    | 'success_login';
};

export const initialAuthFormState: AuthFormState = {status: 'idle'};

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const customerSignupSchema = z.object({
  mode: z.literal('customer'),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  city: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  services: z.string().optional(),
  region: z.string().optional()
});

const providerSignupSchema = z.object({
  mode: z.literal('provider'),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  city: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  services: z.string().trim().min(1),
  region: z.string().trim().min(1)
});

const signupSchema = z.union([customerSignupSchema, providerSignupSchema]);

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const input = {
    email: toText(formData.get('email')),
    password: toText(formData.get('password'))
  };

  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    const hasEmailIssue = parsed.error.issues.some((issue) => issue.path[0] === 'email');

    return {
      status: 'error',
      code: hasEmailIssue ? 'invalid_email' : 'short_password'
    };
  }

  await setAuthCookie(`login:${parsed.data.email}`);

  return {status: 'success', code: 'success_login'};
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const input = {
    mode: toText(formData.get('mode')) as 'customer' | 'provider',
    name: toText(formData.get('name')),
    phone: toText(formData.get('phone')),
    city: toText(formData.get('city')),
    email: toText(formData.get('email')),
    password: toText(formData.get('password')),
    services: toText(formData.get('services')),
    region: toText(formData.get('region'))
  };

  if (!input.mode) {
    return {status: 'error', code: 'required'};
  }

  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    const hasEmailIssue = parsed.error.issues.some((issue) => issue.path[0] === 'email');
    const hasPasswordIssue = parsed.error.issues.some((issue) => issue.path[0] === 'password');
    const hasServiceIssue = parsed.error.issues.some(
      (issue) => issue.path[0] === 'services' || issue.path[0] === 'region'
    );

    if (hasEmailIssue) return {status: 'error', code: 'invalid_email'};
    if (hasPasswordIssue) return {status: 'error', code: 'short_password'};
    if (hasServiceIssue) return {status: 'error', code: 'services_required'};

    return {status: 'error', code: 'required'};
  }

  await setAuthCookie(`signup:${parsed.data.email}`);

  return {
    status: 'success',
    code: parsed.data.mode === 'provider' ? 'success_provider' : 'success_customer'
  };
}
