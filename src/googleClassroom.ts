/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearWorkspaceAccessTokenCache } from './googleWorkspaceAuth';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId?: string;
  creationTime?: string;
  updateTime?: string;
  enrollmentCode?: string;
  courseState?: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink?: string;
}

export interface ClassroomTopic {
  courseId: string;
  topicId: string;
  name: string;
  updateTime?: string;
}

export interface ClassroomCourseWork {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  maxPoints?: number;
  workType?: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
  topicId?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours?: number; minutes?: number };
}

export interface ClassroomMaterial {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  topicId?: string;
}

export interface ClassroomAnnouncement {
  courseId: string;
  id: string;
  text: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  creatorUserId?: string;
}

export interface ClassroomUserProfile {
  id: string;
  name?: {
    givenName?: string;
    familyName?: string;
    fullName?: string;
  };
  emailAddress?: string;
  photoUrl?: string;
}

export interface ClassroomRosterMember {
  courseId: string;
  userId: string;
  profile?: ClassroomUserProfile;
}

export interface ClassroomStudentSubmission {
  courseId: string;
  courseWorkId: string;
  id: string;
  userId: string;
  state?: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  late?: boolean;
  draftGrade?: number;
  assignedGrade?: number;
  alternateLink?: string;
  updateTime?: string;
}

async function classroomFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`https://classroom.googleapis.com/v1/${path}`, {
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
    const errMsg = json?.error?.message || json?.message || `Google Classroom API error (${res.status})`;
    const err = new Error(errMsg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return json as T;
}

export async function listClassroomCourses(accessToken: string): Promise<ClassroomCourse[]> {
  const data = await classroomFetch<{ courses?: ClassroomCourse[] }>('courses?pageSize=30', accessToken);
  return data.courses || [];
}

export async function createClassroomCourse(
  accessToken: string,
  input: {
    name: string;
    section?: string;
    descriptionHeading?: string;
    description?: string;
    room?: string;
    courseState?: 'ACTIVE' | 'PROVISIONED';
  }
): Promise<ClassroomCourse> {
  return classroomFetch<ClassroomCourse>('courses', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      ownerId: 'me',
    }),
  });
}

export async function updateClassroomCourse(
  accessToken: string,
  courseId: string,
  patch: Partial<Pick<ClassroomCourse, 'name' | 'section' | 'descriptionHeading' | 'description' | 'room' | 'courseState'>>
): Promise<ClassroomCourse> {
  const masks = Object.keys(patch).filter(k => (patch as any)[k] !== undefined);
  const query = masks.length > 0 ? `?updateMask=${encodeURIComponent(masks.join(','))}` : '';
  return classroomFetch<ClassroomCourse>(`courses/${encodeURIComponent(courseId)}${query}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteClassroomCourse(accessToken: string, courseId: string): Promise<void> {
  await classroomFetch<Record<string, never>>(`courses/${encodeURIComponent(courseId)}`, accessToken, {
    method: 'DELETE',
  });
}

export async function listCourseTopics(accessToken: string, courseId: string): Promise<ClassroomTopic[]> {
  const data = await classroomFetch<{ topic?: ClassroomTopic[] }>(
    `courses/${encodeURIComponent(courseId)}/topics?pageSize=30`,
    accessToken
  );
  return data.topic || [];
}

export async function createCourseTopic(
  accessToken: string,
  courseId: string,
  name: string
): Promise<ClassroomTopic> {
  return classroomFetch<ClassroomTopic>(`courses/${encodeURIComponent(courseId)}/topics`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function listCourseWork(accessToken: string, courseId: string): Promise<ClassroomCourseWork[]> {
  const data = await classroomFetch<{ courseWork?: ClassroomCourseWork[] }>(
    `courses/${encodeURIComponent(courseId)}/courseWork?pageSize=30`,
    accessToken
  );
  return data.courseWork || [];
}

export async function createCourseWork(
  accessToken: string,
  courseId: string,
  input: {
    title: string;
    description?: string;
    maxPoints?: number;
    topicId?: string;
    state?: 'PUBLISHED' | 'DRAFT';
    dueDate?: { year: number; month: number; day: number };
    dueTime?: { hours: number; minutes: number };
  }
): Promise<ClassroomCourseWork> {
  return classroomFetch<ClassroomCourseWork>(`courses/${encodeURIComponent(courseId)}/courseWork`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      workType: 'ASSIGNMENT',
      state: input.state || 'PUBLISHED',
    }),
  });
}

export async function deleteCourseWork(
  accessToken: string,
  courseId: string,
  courseWorkId: string
): Promise<void> {
  await classroomFetch<Record<string, never>>(
    `courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}`,
    accessToken,
    { method: 'DELETE' }
  );
}

export async function listCourseWorkMaterials(
  accessToken: string,
  courseId: string
): Promise<ClassroomMaterial[]> {
  const data = await classroomFetch<{ courseWorkMaterial?: ClassroomMaterial[] }>(
    `courses/${encodeURIComponent(courseId)}/courseWorkMaterials?pageSize=30`,
    accessToken
  );
  return data.courseWorkMaterial || [];
}

export async function createCourseWorkMaterial(
  accessToken: string,
  courseId: string,
  input: {
    title: string;
    description?: string;
    topicId?: string;
    state?: 'PUBLISHED' | 'DRAFT';
  }
): Promise<ClassroomMaterial> {
  return classroomFetch<ClassroomMaterial>(
    `courses/${encodeURIComponent(courseId)}/courseWorkMaterials`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        state: input.state || 'PUBLISHED',
      }),
    }
  );
}

export async function listAnnouncements(
  accessToken: string,
  courseId: string
): Promise<ClassroomAnnouncement[]> {
  const data = await classroomFetch<{ announcements?: ClassroomAnnouncement[] }>(
    `courses/${encodeURIComponent(courseId)}/announcements?pageSize=30`,
    accessToken
  );
  return data.announcements || [];
}

export async function createAnnouncement(
  accessToken: string,
  courseId: string,
  text: string,
  state: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED'
): Promise<ClassroomAnnouncement> {
  return classroomFetch<ClassroomAnnouncement>(
    `courses/${encodeURIComponent(courseId)}/announcements`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ text, state }),
    }
  );
}

export async function deleteAnnouncement(
  accessToken: string,
  courseId: string,
  announcementId: string
): Promise<void> {
  await classroomFetch<Record<string, never>>(
    `courses/${encodeURIComponent(courseId)}/announcements/${encodeURIComponent(announcementId)}`,
    accessToken,
    { method: 'DELETE' }
  );
}

export async function listCourseTeachers(
  accessToken: string,
  courseId: string
): Promise<ClassroomRosterMember[]> {
  const data = await classroomFetch<{ teachers?: ClassroomRosterMember[] }>(
    `courses/${encodeURIComponent(courseId)}/teachers?pageSize=30`,
    accessToken
  );
  return data.teachers || [];
}

export async function listCourseStudents(
  accessToken: string,
  courseId: string
): Promise<ClassroomRosterMember[]> {
  const data = await classroomFetch<{ students?: ClassroomRosterMember[] }>(
    `courses/${encodeURIComponent(courseId)}/students?pageSize=50`,
    accessToken
  );
  return data.students || [];
}

export async function inviteStudentToCourse(
  accessToken: string,
  courseId: string,
  userEmailOrId: string
): Promise<any> {
  return classroomFetch<any>('invitations', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      userId: userEmailOrId.trim(),
      role: 'STUDENT',
    }),
  });
}

export async function removeStudentFromCourse(
  accessToken: string,
  courseId: string,
  userId: string
): Promise<void> {
  await classroomFetch<Record<string, never>>(
    `courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(userId)}`,
    accessToken,
    { method: 'DELETE' }
  );
}

export async function listStudentSubmissions(
  accessToken: string,
  courseId: string,
  courseWorkId: string
): Promise<ClassroomStudentSubmission[]> {
  const data = await classroomFetch<{ studentSubmissions?: ClassroomStudentSubmission[] }>(
    `courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions?pageSize=50`,
    accessToken
  );
  return data.studentSubmissions || [];
}

export async function gradeStudentSubmission(
  accessToken: string,
  courseId: string,
  courseWorkId: string,
  submissionId: string,
  assignedGrade: number,
  draftGrade: number
): Promise<ClassroomStudentSubmission> {
  return classroomFetch<ClassroomStudentSubmission>(
    `courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}?updateMask=assignedGrade,draftGrade`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ assignedGrade, draftGrade }),
    }
  );
}
