UPDATE ItemTransactions 
SET TransactionCode = 'TXN-' || "TransactionId" 
WHERE TransactionCode IS NULL OR TransactionCode = '';

-- Note: The exact string concatenation operator depends on SQL dialect.
-- We are mostly using PostgreSQL, SQLite, or SQL Server.
-- If this is SQL Server:
-- UPDATE [ItemTransactions] SET [TransactionCode] = 'TXN-' + CAST([TransactionId] AS NVARCHAR(50)) WHERE [TransactionCode] IS NULL OR [TransactionCode] = '';