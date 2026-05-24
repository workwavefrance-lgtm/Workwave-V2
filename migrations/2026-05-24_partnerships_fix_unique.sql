-- Fix : remplace l'index unique fonctionnel (LOWER(contact_email)) par une
-- vraie contrainte UNIQUE simple sur contact_email, ciblable par ON CONFLICT.
-- Le script seed lowercase + trim avant INSERT, donc l'unicite est garantie.

DROP INDEX IF EXISTS idx_partnerships_email_unique;

ALTER TABLE partnerships
  DROP CONSTRAINT IF EXISTS partnerships_email_unique;

ALTER TABLE partnerships
  ADD CONSTRAINT partnerships_email_unique UNIQUE (contact_email);
