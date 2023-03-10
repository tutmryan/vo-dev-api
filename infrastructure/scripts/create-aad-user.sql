CREATE USER [<aad-user>] FROM EXTERNAL PROVIDER;

ALTER ROLE [db_datareader] ADD MEMBER [<aad-user>];
ALTER ROLE [db_datawriter] ADD MEMBER [<aad-user>];

-- Uncomment below line if necessary
-- ALTER ROLE [db_ddladmin] ADD MEMBER [<aad-user>];
