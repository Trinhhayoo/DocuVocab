INSERT INTO "UserSetting" (
    "userId",
    "allowGlobalVocabulary",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;