import { z } from "zod";

const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(4, "Password must be at least 4 characters")
      .max(100, "Password must be less than 100 characters"),
    passwordConfirm: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || phoneRegex.test(val),
        "Invalid phone number format",
      ),
    bio: z
      .string()
      .max(1000, "Bio must be less than 1000 characters")
      .optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    province: z.string().optional(),
    skills: z.union([z.string(), z.array(z.string())]).optional(),
    languages: z.union([z.string(), z.array(z.string())]).optional(),
    hourlyRate: z.string().optional(),
    experienceLevel: z
      .enum(["entry", "intermediate", "expert"])
      .optional()
      .default("entry"),
    jobTypePreference: z
      .enum(["digital", "physical", "both"])
      .optional()
      .default("digital"),
    availabilityStatus: z
      .enum(["available", "busy", "unavailable"])
      .optional()
      .default("available"),
    roles: z
      .array(z.enum(["freelancer", "client", "admin"]))
      .min(1, "Please select at least one role"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || phoneRegex.test(val),
      "Invalid phone number format",
    ),
  avatar: z.string().url("Invalid URL").optional().nullable(),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  lat: z
    .number()
    .optional()
    .refine((val) => val === undefined || (val >= -90 && val <= 90), {
      message: "Latitude must be between -90 and 90",
    }),
  lng: z
    .number()
    .optional()
    .refine((val) => val === undefined || (val >= -180 && val <= 180), {
      message: "Longitude must be between -180 and 180",
    }),
  skills: z.string().optional(),
  hourlyRate: z
    .number()
    .min(0, "Hourly rate must be positive")
    .optional()
    .default(0),
  experienceLevel: z
    .enum(["entry", "intermediate", "expert"])
    .optional()
    .default("entry"),
  jobTypePreference: z
    .enum(["digital", "physical", "both"])
    .optional()
    .default("digital"),
  availabilityStatus: z
    .enum(["available", "busy", "unavailable"])
    .optional()
    .default("available"),
  languages: z.string().optional(),
  portfolio: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().max(1000, "Description too long").optional(),
        imageUrls: z.string().optional(),
        projectUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
        skills: z.string().optional(),
        completedAt: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const proposalSchema = z.object({
  job: z.string().min(1, "Job ID is required"),
  amount: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  coverLetter: z
    .string()
    .min(1, "Cover letter is required")
    .min(5, "Cover letter must be at least 5 characters")
    .max(5000, "Cover letter must be less than 5000 characters"),
  deliveryDays: z
    .number({ message: "Delivery days must be a number" })
    .int("Must be a whole number")
    .positive("Delivery days must be at least 1"),
  revisionsIncluded: z.number().int().min(0).default(0),
  attachments: z.array(z.string().url("Invalid URL")).optional().default([]),
});

const milestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().optional(),
  value: z
    .number({ message: "Value must be a number" })
    .positive("Value must be greater than 0"),
  dueDate: z.number().optional(),
});

export const jobCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Job title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  jobType: z.enum(["digital", "physical"]).default("digital"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  requiredSkills: z.array(z.string()).optional().default([]),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]).optional(),
  budgetType: z.enum(["fixed", "hourly"]).default("fixed"),
  budget: z
    .object({
      min: z.number().min(0, "Minimum budget cannot be negative"),
      max: z.number().min(0, "Maximum budget cannot be negative").optional(),
      currency: z.string().default("NPR"),
    })
    .refine((data) => !data.max || data.max >= data.min, {
      message: "Maximum budget must be greater than minimum budget",
      path: ["max"],
    }),
  deadline: z.string().optional(),
  isUrgent: z.boolean().optional().default(false),
  location: z
    .object({
      city: z.string().optional(),
      district: z.string().optional(),
      province: z.string().optional(),
    })
    .optional(),
  isPublic: z.boolean().optional().default(true),
  milestones: z.array(milestoneSchema).optional().default([]),
});

export const validateForm = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { errors: null, data: result.data };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { errors, data: null };
};

export const getFieldError = (errors, field) => {
  if (!errors) return null;
  return errors[field] || errors[field.replace(/(\.\d+\.)/g, ".")] || null;
};
