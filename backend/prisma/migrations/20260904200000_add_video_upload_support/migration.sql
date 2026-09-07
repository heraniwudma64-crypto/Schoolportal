-- Migration: Add VideoSourceType Enum and video file upload support to educational_videos
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VideoSourceType') THEN
    CREATE TYPE "VideoSourceType" AS ENUM ('YOUTUBE', 'UPLOAD');
  END IF;
END $$;

-- AlterTable: add columns and allow NULL for youtubeUrl and youtubeVideoId
ALTER TABLE "educational_videos"
  ADD COLUMN IF NOT EXISTS "sourceType" "VideoSourceType" NOT NULL DEFAULT 'YOUTUBE',
  ADD COLUMN IF NOT EXISTS "videoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" BIGINT,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
  ALTER COLUMN "youtubeUrl" DROP NOT NULL,
  ALTER COLUMN "youtubeVideoId" DROP NOT NULL;
