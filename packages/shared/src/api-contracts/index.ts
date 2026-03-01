export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  institutionId: string;
  email: string;
  password: string;
};

export type AssignmentDto = {
  id: string;
  institutionId: string;
  courseId: string;
  studentId: string;
  title: string;
  dueDate: string;
  status: "draft" | "active" | "submitted";
};
