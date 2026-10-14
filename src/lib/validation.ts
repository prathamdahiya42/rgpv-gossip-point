import { z } from 'zod';

// Detect phone numbers (including spaced/dashed digits), emails, and social handles
const PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}|\b\d{5}[\s-]?\d{5}\b|\b\d{10}\b/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9._]{3,30}|\b(?:ig|insta|snap|snapchat|telegram|tg|wa|whatsapp)[:\s]+[a-zA-Z0-9._]+/i;

export function containsContactInfo(text: string): boolean {
  return PHONE_REGEX.test(text) || EMAIL_REGEX.test(text) || SOCIAL_HANDLE_REGEX.test(text);
}

export const postSchema = z.object({
  section: z.enum(['crushes', 'gossip', 'campus', 'garba']),
  body: z
    .string()
    .min(10, 'Post must be at least 10 characters long')
    .max(500, 'Post cannot exceed 500 characters')
    .refine((val) => !containsContactInfo(val), {
      message: 'Keep it anonymous, no personal contact info.',
    }),
});

export const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(300, 'Comment cannot exceed 300 characters')
    .refine((val) => !containsContactInfo(val), {
      message: 'Keep it anonymous, no personal contact info.',
    }),
});
