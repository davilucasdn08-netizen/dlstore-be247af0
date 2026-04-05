-- Habilita o pg_cron e o http (necessário para chamar a Edge Function como cron job)
-- Agendar a função sync-prices para rodar a cada 6 horas automaticamente

-- 1. Habilita a extensão pg_cron (se não estiver habilitada)
-- (No Supabase, pg_cron é habilitado via dashboard em Database > Extensions)

-- 2. Cron: roda a cada 6 horas (0h, 6h, 12h, 18h UTC)
SELECT
  cron.schedule(
    'sync-amazon-prices',         -- nome único do job
    '0 */6 * * *',                 -- a cada 6 horas
    $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/sync-prices',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := '{}'::jsonb
    );
    $$
  );
