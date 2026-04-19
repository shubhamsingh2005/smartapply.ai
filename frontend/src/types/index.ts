export interface PersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface Experience {
  role?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  id?: string;
}

export interface Education {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface ERPData {
  personal?: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  projects?: any[];
  skills?: any;
  certifications?: any[];
  [key: string]: unknown;
}

export interface Profile {
  user_info?: {
    full_name: string;
    email: string;
    profile_image?: string;
  };
  erp_data?: ERPData;
  meta?: any;
}
