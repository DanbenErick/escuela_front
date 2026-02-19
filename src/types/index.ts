// ─── Database Entity Interfaces ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role_id: number;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  family_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  document_number: string | null;
  medical_info: string | null;
  family_code?: string;
  photo_url?: string;
}

export interface Family {
  id: string;
  family_code: string | null;
  main_guardian_id: string;
}

export interface Course {
  id: string;
  name: string | null;
  teacher_id: string;
  schedule_json: Record<string, unknown> | null;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  year: number;
}

export interface FeeConcept {
  id: number;
  name: string | null;
  amount: number | null;
  due_date: string | null;
}

export interface StudentFee {
  id: string;
  student_id: string;
  concept_id: number;
  original_amount: number;
  balance: number;
  status: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_fee_id: string;
  amount_paid: number;
  payment_method: string | null;
  transaction_ref: string | null;
  paid_at: string;
}

export interface Grade {
  id: string;
  enrollment_id: string;
  unit: string | null;
  score: number;
  comments: string | null;
}

export interface Communication {
  id: string;
  sender_id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  target_role: number | null;
  created_at: string;
  sender_name?: string;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  role_id: number;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: Record<string, unknown>;
  };
}

export interface CreateStudentRequest {
  family_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  document_number?: string;
  medical_info?: string;
}

export interface UpdateStudentRequest {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  document_number?: string;
  medical_info?: string;
}

export interface GenerateFeesRequest {
  concept_id: number;
  student_ids: string[];
}

export interface RegisterPaymentRequest {
  student_fee_id: string;
  amount: number;
  payment_method: string;
  transaction_ref?: string;
}

export interface FamilyDebt {
  student_id: string;
  student_first_name: string | null;
  student_last_name: string | null;
  fee_id: string;
  concept_name: string | null;
  original_amount: number;
  balance: number;
  status: string;
  due_date: string | null;
}

export interface GradeInput {
  enrollment_id: string;
  unit: string;
  score: number;
  comments?: string;
}

export interface AttendanceInput {
  enrollment_id: string;
  date: string;
  status: string;
}

export interface ReportCardEntry {
  grade_id: string;
  course_id: string;
  course_name: string | null;
  unit: string | null;
  score: number;
  comments: string | null;
}

export interface CreatePostRequest {
  title: string;
  body: string;
  type: string;
  target_role?: number;
}

export interface CreateFamilyRequest {
  family_code: string;
  main_guardian_id: string;
}

export interface CreateCourseRequest {
  name: string;
  teacher_id: string;
  schedule_json?: Record<string, unknown>;
}

export interface CreateEnrollmentRequest {
  student_id: string;
  course_id: string;
  year: number;
}

export interface CreateConceptRequest {
  name: string;
  amount: number;
  due_date: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
