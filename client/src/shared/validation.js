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
  physicalServicesOffered: z.string().optional(),
  serviceAreas: z.string().optional(),
  onsiteAvailable: z.boolean().optional().default(false),
  hasOwnTools: z.boolean().optional().default(false),
  licenseOrCertification: z
    .string()
    .max(500, "Certification details must be less than 500 characters")
    .optional(),
  tradeExperienceYears: z
    .number()
    .min(0, "Trade experience cannot be negative")
    .optional()
    .default(0),
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
  verificationDocuments: z
    .array(
      z.object({
        name: z.string().max(200, "Document name is too long").optional(),
        url: z.string().url("Document URL must be valid"),
        publicId: z.string().optional(),
        resourceType: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const proposalSchema = z.object({
  job: z.string().min(1, "Job ID is required"),
  pricingType: z
    .enum(["fixed_quote", "inspection_required"])
    .optional()
    .default("fixed_quote"),
  amount: z
    .number({ message: "Amount must be a number" })
    .min(0, "Amount must be zero or greater"),
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
  visitAvailableOn: z.string().optional(),
  inspectionNotes: z.string().max(3000).optional(),
  attachments: z.array(z.string().url("Invalid URL")).optional().default([]),
}).superRefine((data, context) => {
  if (data.pricingType === "fixed_quote" && Number(data.amount || 0) <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount must be greater than 0 for a fixed quote",
      path: ["amount"],
    });
  }
});

export const milestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().optional(),
  value: z
    .number({ message: "Value must be a number" })
    .positive("Value must be greater than 0"),
  dueDate: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      if (typeof value === "string") {
        const timestamp = Date.parse(value);
        return Number.isNaN(timestamp) ? value : timestamp;
      }

      return value;
    }, z.number().optional())
    .optional(),
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
  budgetType: z
    .enum(["fixed_budget", "inspection_required"])
    .optional()
    .default("fixed_budget"),
  deadline: z.string().optional(),
  isUrgent: z.boolean().optional().default(false),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      province: z.string().optional(),
    })
    .optional(),
  physicalDetails: z
    .object({
      propertyType: z.string().optional(),
      siteVisitRequired: z.boolean().optional().default(false),
      preferredVisitDate: z.string().optional(),
      preferredWorkDate: z.string().optional(),
      materialsPreference: z
        .enum(["client", "freelancer", "shared"])
        .optional(),
      safetyNotes: z.string().max(2000).optional(),
      estimatedDuration: z.string().max(200).optional(),
    })
    .optional(),
  isPublic: z.boolean().optional().default(true),
  attachments: z.array(z.string().url("Invalid URL")).optional().default([]),
}).superRefine((data, context) => {
  if (data.budgetType === "fixed_budget" && Number(data.budget?.min || 0) <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum budget must be greater than 0",
      path: ["budget", "min"],
    });
  }

  if (data.jobType === "physical") {
    if (!data.location?.city && !data.location?.district) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least a city or district for a physical job",
        path: ["location", "city"],
      });
    }

    if (!data.category) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a service category for a physical job",
        path: ["category"],
      });
    }
  }
});

export const contractCreateSchema = z
  .object({
    proposalId: z.string().optional(),
    bookingId: z.string().optional(),
    title: z.string().min(1, "Contract title is required").max(200),
    description: z.string().max(5000).optional(),
    terms: z.string().max(5000).optional(),
    contractType: z.enum(["full_project", "milestone_based"]),
    serviceMode: z.enum(["digital", "physical"]).optional().default("digital"),
    physicalVisit: z
      .object({
        isRequired: z.boolean().optional().default(false),
        preferredVisitDate: z.string().optional(),
        preferredWorkDate: z.string().optional(),
        inspectionSummary: z.string().max(5000).optional(),
        materialsAgreement: z.string().max(2000).optional(),
      })
      .optional(),
    totalAmount: z.number().min(0).optional(),
    milestones: z.array(milestoneSchema).optional().default([]),
  })
  .superRefine((data, context) => {
    if (!data.proposalId && !data.bookingId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Proposal or booking is required",
        path: ["proposalId"],
      });
    }

    if (
      data.contractType === "milestone_based" &&
      data.milestones.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one milestone for milestone-based contracts",
        path: ["milestones"],
      });
    }

    if (
      data.contractType === "full_project" &&
      (!data.totalAmount || data.totalAmount <= 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a total amount for full-project contracts",
        path: ["totalAmount"],
      });
    }
  });

export const reviewCreateSchema = z.object({
  rating: z
    .number({ message: "Rating must be a number" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .max(2000, "Review must be less than 2000 characters")
    .optional()
    .default(""),
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
