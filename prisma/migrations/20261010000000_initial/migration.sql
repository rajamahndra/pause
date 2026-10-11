-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" VARCHAR(60),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Makassar',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(120),
    "occurredAt" TIMESTAMPTZ,
    "occurredTimezone" VARCHAR(100),
    "sensations" JSONB NOT NULL DEFAULT '[]',
    "situation" TEXT,
    "narrative" TEXT,
    "takeaway" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAction" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "actionKey" VARCHAR(80),
    "label" VARCHAR(200) NOT NULL,
    "helpful" BOOLEAN,
    "position" INTEGER NOT NULL,

    CONSTRAINT "JournalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "reminder" TEXT,
    "preferredGuide" VARCHAR(10),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SupportPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportPlanStep" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "text" VARCHAR(300) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SupportPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedContact" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TrustedContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_occurredAt_idx" ON "JournalEntry"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalAction_entryId_idx" ON "JournalAction"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportPlan_userId_key" ON "SupportPlan"("userId");

-- CreateIndex
CREATE INDEX "SupportPlanStep_planId_idx" ON "SupportPlanStep"("planId");

-- CreateIndex
CREATE INDEX "TrustedContact_planId_idx" ON "TrustedContact"("planId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAction" ADD CONSTRAINT "JournalAction_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportPlan" ADD CONSTRAINT "SupportPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportPlanStep" ADD CONSTRAINT "SupportPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SupportPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedContact" ADD CONSTRAINT "TrustedContact_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SupportPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
