import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const institution = await prisma.institution.upsert({
    where: { code: "NTNU-MOCK" },
    update: {},
    create: {
      code: "NTNU-MOCK",
      name: "NTNU (Mock)",
    },
  });

  const course = await prisma.course.upsert({
    where: {
      institutionId_code_term: {
        institutionId: institution.id,
        code: "TDT4100",
        term: "2026-spring",
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      code: "TDT4100",
      name: "Object-Oriented Programming",
      term: "2026-spring",
    },
  });

  const adminPassword = await argon2.hash("AdminPassword123!", { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { institutionId_email: { institutionId: institution.id, email: "admin@aiguidebook.local" } },
    update: {},
    create: {
      institutionId: institution.id,
      email: "admin@aiguidebook.local",
      passwordHash: adminPassword,
      role: "admin",
    },
  });

  const existingSet = await prisma.guidelineSet.findFirst({
    where: { institutionId: institution.id, scopeType: "institution", version: 1 },
  });

  if (!existingSet) {
    await prisma.guidelineSet.create({
      data: {
        institutionId: institution.id,
        scopeType: "institution",
        version: 1,
        status: "published",
        sourceType: "seed",
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
        rules: {
          create: [
            {
              ruleCode: "NTNU-AI-001",
              title: "Excessive AI dependency warning",
              description: "Warn if very high number of logs are recorded for one assignment.",
              severity: "warning",
              conditionJson: { maxLogs: 20 },
              adviceText: "You have many AI interactions. Add reflection on independent work and learning outcomes.",
            },
            {
              ruleCode: "NTNU-AI-002",
              title: "Disallowed usage purpose warning",
              description: "Warn if disallowed purpose appears.",
              severity: "high",
              conditionJson: { disallowedPurpose: "translation" },
              adviceText: "Translation use may be restricted for this context. Verify course-specific policy.",
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete", { institutionId: institution.id, courseId: course.id });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
