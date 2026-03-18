export type EmployeeProfile = {
  id: string;
  name: string;
  title: string;
  department: string;
  expertise: string[];
  skills: string[];
  email: string;
};

export type ProfileFormData = {
  name: string;
  title: string;
  department: string;
  skillsText: string;
  expertiseText: string;
  email: string;
};
