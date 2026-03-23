-- Check table engines in database: real_estate_service
SELECT
  TABLE_NAME,
  ENGINE,
  TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'real_estate_service'
ORDER BY TABLE_NAME;

-- Show only tables that are NOT InnoDB
SELECT
  TABLE_NAME,
  ENGINE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'real_estate_service'
  AND ENGINE <> 'InnoDB'
ORDER BY TABLE_NAME;

-- Optional: convert all non-InnoDB tables to InnoDB
-- (Review output of the second query first)
-- SET @db := 'real_estate_service';
-- SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` ENGINE=InnoDB;') AS sql_stmt
-- FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA = @db AND ENGINE <> 'InnoDB';
