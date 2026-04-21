export type EmployeeProfile = {
  id: string;
  name: string;
  title: string;
  department: string;
  expertise: string[];
  skills: string[];
  email: string;
  avatarUrl?: string;
  presence?: string;
  location?: string;
  rawStatus?: string;
};

export type ProfileFormData = {
  name: string;
  title: string;
  department: string;
  skillsText: string;
  expertiseText: string;
  email: string;
};
