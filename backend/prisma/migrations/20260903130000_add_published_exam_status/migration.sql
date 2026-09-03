-- Migration: add PUBLISHED variant to ExamStatus enum
-- This allows teachers to explicitly publish an admin-approved exam to students,
-- setting the delivery window in a single atomic operation.

ALTER TYPE "ExamStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';
