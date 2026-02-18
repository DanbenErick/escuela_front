import api from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateStudentRequest,
  UpdateStudentRequest,
  Student,
  User,
  Family,
  CreateFamilyRequest,
  Course,
  CreateCourseRequest,
  Enrollment,
  CreateEnrollmentRequest,
  FeeConcept,
  CreateConceptRequest,
  GenerateFeesRequest,
  FamilyDebt,
  RegisterPaymentRequest,
  GradeInput,
  AttendanceInput,
  ReportCardEntry,
  Communication,
  CreatePostRequest,
  ApiResponse,
} from '../types';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse>('/auth/register', data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: () =>
    api.get<ApiResponse<User[]>>('/users'),

  update: (id: string, data: { full_name?: string; role_id?: number }) =>
    api.put<ApiResponse>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse>(`/users/${id}`),
};

// ─── Families ────────────────────────────────────────────────────────────────

export const familiesApi = {
  create: (data: CreateFamilyRequest) =>
    api.post<ApiResponse<Family>>('/families', data),

  getById: (id: string) =>
    api.get<ApiResponse<Family>>(`/families/${id}`),

  getAll: () =>
    api.get<ApiResponse<Family[]>>('/families'),

  getByGuardian: (guardianId: string) =>
    api.get<ApiResponse<Family[]>>(`/families/guardian/${guardianId}`),

  update: (id: string, data: { family_code?: string; main_guardian_id?: string }) =>
    api.put<ApiResponse<Family>>(`/families/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse>(`/families/${id}`),
};

// ─── Students ────────────────────────────────────────────────────────────────

export const studentsApi = {
  getAll: () =>
    api.get<ApiResponse<Student[]>>('/students'),

  create: (data: CreateStudentRequest) =>
    api.post<ApiResponse<Student>>('/students', data),

  getById: (id: string) =>
    api.get<ApiResponse<Student>>(`/students/${id}`),

  getByFamily: (familyId: string) =>
    api.get<ApiResponse<Student[]>>(`/students/family/${familyId}`),

  update: (id: string, data: UpdateStudentRequest) =>
    api.put<ApiResponse<Student>>(`/students/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse>(`/students/${id}`),
};

// ─── Fee Concepts ────────────────────────────────────────────────────────────

export const conceptsApi = {
  create: (data: CreateConceptRequest) =>
    api.post<ApiResponse<FeeConcept>>('/finance/concepts', data),

  getAll: () =>
    api.get<ApiResponse<FeeConcept[]>>('/finance/concepts'),
};

// ─── Finance ─────────────────────────────────────────────────────────────────

export const financeApi = {
  generateFees: (data: GenerateFeesRequest) =>
    api.post<ApiResponse>('/finance/fees/generate', data),

  getFamilyDebt: (familyId: string) =>
    api.get<ApiResponse<FamilyDebt[]>>(`/finance/debts/family/${familyId}`),

  registerPayment: (data: RegisterPaymentRequest) =>
    api.post<ApiResponse>('/finance/payments', data),
};

// ─── Courses ─────────────────────────────────────────────────────────────────

export const coursesApi = {
  create: (data: CreateCourseRequest) =>
    api.post<ApiResponse<Course>>('/courses', data),

  getAll: () =>
    api.get<ApiResponse<Course[]>>('/courses'),
};

// ─── Enrollments ─────────────────────────────────────────────────────────────

export const enrollmentsApi = {
  create: (data: CreateEnrollmentRequest) =>
    api.post<ApiResponse<Enrollment>>('/enrollments', data),

  getByStudent: (studentId: string) =>
    api.get<ApiResponse<Enrollment[]>>(`/enrollments/student/${studentId}`),
};

// ─── Academic ────────────────────────────────────────────────────────────────

export const academicApi = {
  inputGrades: (data: GradeInput) =>
    api.post<ApiResponse>('/academic/grades', data),

  getReportCard: (studentId: string) =>
    api.get<ApiResponse<ReportCardEntry[]>>(`/academic/report-card/${studentId}`),

  markAttendance: (data: AttendanceInput) =>
    api.post<ApiResponse>('/academic/attendance', data),
};

// ─── Communication ───────────────────────────────────────────────────────────

export const communicationApi = {
  getFeed: () =>
    api.get<ApiResponse<Communication[]>>('/communications/feed'),

  createPost: (data: CreatePostRequest) =>
    api.post<ApiResponse>('/communications', data),
};
