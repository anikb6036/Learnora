/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SCOPES,
  initWorkspaceAuth,
  signInWithGoogleWorkspace,
  getWorkspaceAccessToken,
  getWorkspaceUser,
  clearWorkspaceToken,
  clearWorkspaceAccessTokenCache,
} from './googleWorkspaceAuth';

export { SCOPES };
export const initMeetAuth = initWorkspaceAuth;
export const signInWithGoogleMeet = signInWithGoogleWorkspace;
export const getMeetAccessToken = getWorkspaceAccessToken;
export const getMeetUser = getWorkspaceUser;
export const clearMeetToken = clearWorkspaceToken;

export type MeetAccessType = 'ACCESS_TYPE_UNSPECIFIED' | 'OPEN' | 'TRUSTED' | 'RESTRICTED';
export type MeetEntryPointAccess = 'ENTRY_POINT_ACCESS_UNSPECIFIED' | 'ALL' | 'CREATOR_APP_ONLY';
export type MeetModeration = 'MODERATION_UNSPECIFIED' | 'OFF' | 'ON';

export interface MeetSpaceConfig {
  accessType?: MeetAccessType;
  entryPointAccess?: MeetEntryPointAccess;
  moderation?: MeetModeration;
}

export interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: MeetSpaceConfig;
  activeConference?: {
    conferenceRecord?: string;
  };
}

export interface MeetConferenceRecord {
  name: string;
  startTime?: string;
  endTime?: string;
  expireTime?: string;
  space?: string;
}

export interface MeetParticipant {
  name: string;
  earliestStartTime?: string;
  latestEndTime?: string;
  signedinUser?: {
    user?: string;
    displayName?: string;
  };
  anonymousUser?: {
    displayName?: string;
  };
  phoneUser?: {
    displayName?: string;
  };
}

export interface MeetRecording {
  name: string;
  state?: string;
  startTime?: string;
  endTime?: string;
  driveDestination?: {
    file?: string;
    exportUri?: string;
  };
}

export function normalizeSpaceIdentifier(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('spaces/')) return trimmed;

  // Extract meeting code from full URL like https://meet.google.com/abc-defg-hij?pli=1
  const urlMatch = trimmed.match(/meet\.google\.com\/([a-zA-Z0-9-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return `spaces/${urlMatch[1]}`;
  }

  return `spaces/${trimmed.replace(/^\/+/, '')}`;
}

async function meetFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`https://meet.googleapis.com/v2/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let json: any = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearWorkspaceAccessTokenCache();
    }
    const errMsg = json?.error?.message || json?.message || `Google Meet API error (${res.status})`;
    const err = new Error(errMsg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return json as T;
}

export async function createMeetSpace(
  accessToken: string,
  config?: MeetSpaceConfig
): Promise<MeetSpace> {
  const payload: { config?: MeetSpaceConfig } = {};
  if (config && Object.keys(config).length > 0) {
    payload.config = config;
  }

  return meetFetch<MeetSpace>('spaces', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMeetSpace(
  accessToken: string,
  spaceNameOrCode: string
): Promise<MeetSpace> {
  const normalized = normalizeSpaceIdentifier(spaceNameOrCode);
  if (!normalized) {
    throw new Error('Please enter a valid Google Meet link, meeting code, or space name.');
  }
  return meetFetch<MeetSpace>(normalized, accessToken, {
    method: 'GET',
  });
}

export async function updateMeetSpaceSettings(
  accessToken: string,
  spaceName: string,
  config: MeetSpaceConfig
): Promise<MeetSpace> {
  const normalized = normalizeSpaceIdentifier(spaceName);
  const masks: string[] = [];
  if (config.accessType) masks.push('config.accessType');
  if (config.entryPointAccess) masks.push('config.entryPointAccess');
  if (config.moderation) masks.push('config.moderation');

  const query = masks.length > 0 ? `?updateMask=${encodeURIComponent(masks.join(','))}` : '';
  return meetFetch<MeetSpace>(`${normalized}${query}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ config }),
  });
}

export async function endActiveConference(
  accessToken: string,
  spaceName: string
): Promise<void> {
  const normalized = normalizeSpaceIdentifier(spaceName);
  await meetFetch<Record<string, never>>(`${normalized}:endActiveConference`, accessToken, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function listConferenceRecords(
  accessToken: string,
  spaceName?: string,
  pageSize = 10
): Promise<MeetConferenceRecord[]> {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (spaceName && spaceName.trim()) {
    const normalized = normalizeSpaceIdentifier(spaceName);
    params.set('filter', `space.name="${normalized}"`);
  }

  const data = await meetFetch<{ conferenceRecords?: MeetConferenceRecord[] }>(
    `conferenceRecords?${params.toString()}`,
    accessToken,
    { method: 'GET' }
  );
  return data.conferenceRecords || [];
}

export async function listConferenceParticipants(
  accessToken: string,
  conferenceRecordName: string
): Promise<MeetParticipant[]> {
  const data = await meetFetch<{ participants?: MeetParticipant[] }>(
    `${conferenceRecordName}/participants?pageSize=50`,
    accessToken,
    { method: 'GET' }
  );
  return data.participants || [];
}

export async function listConferenceRecordings(
  accessToken: string,
  conferenceRecordName: string
): Promise<MeetRecording[]> {
  const data = await meetFetch<{ recordings?: MeetRecording[] }>(
    `${conferenceRecordName}/recordings?pageSize=20`,
    accessToken,
    { method: 'GET' }
  );
  return data.recordings || [];
}
