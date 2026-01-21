BEGIN;
  WITH src AS
  (
            SELECT    ea.*,
                      p.username AS external_username,
                      (row_number() OVER ( partition BY ea.person_id ORDER BY ea.updated_at DESC, ea.created_at DESC, ea.address ASC) - 1) AS prio_zero_based
                      --Wie ist das entstanden? findEnabledByPerson guckt auf status = ENABLED und nicht auf created_at/updated_at. So bekäme doch die email mit der neusten updated_at den nuller prio wert. Das kann doch auch sein wenn die person gelöscht wurde dann sind alle gleich
                      --WENn status ENABLED dann prio 0, sonst nach updated_at DESC
            FROM      PUBLIC.email_address ea
            LEFT JOIN PUBLIC.person p
            ON        p.id = ea.person_id), ins AS
  (
    INSERT INTO email.address
                          (
                                      id,
                                      created_at,
                                      updated_at,
                                      address,
                                      priority,
                                      ox_user_counter,
                                      external_id,
                                      spsh_person_id,
                                      marked_for_cron
                          )
              SELECT Gen_random_uuid() AS id,
                     s.created_at,
                     s.updated_at,
                     s.address,
                     s.prio_zero_based AS priority,
                     s.ox_user_id      AS ox_user_counter,
                     s.person_id       AS spsh_person_id,
                     CASE
                            WHEN s.status <> 'ENABLED' THEN s.updated_at + interval '180 days'
                            ELSE NULL
                     END AS marked_for_cron
              FROM   src s returning id,
                     address,
                     spsh_person_id)

    INSERT INTO email.address_status
              (
                          id,
                          email_address_id,
                          status,
                          created_at,
                          updated_at
              )
  SELECT Gen_random_uuid() AS id,
         i.id              AS email_address_id, (
         CASE s.status
                WHEN 'ENABLED' THEN 'ACTIVE'
                WHEN 'DISABLED' THEN
                       CASE
                              WHEN EXISTS
                                     (
                                            SELECT 1
                                            FROM   PUBLIC.personenkontext pk
                                            WHERE  pk.person_id = s.person_id ) THEN 'DEACTIVE' --Es müsste der letzte sein der dich auf Email Berechtigt nicht genrell der letzte
                              ELSE 'SUSPENDED'
                       END
                WHEN 'REQUESTED' THEN 'PENDING'
                WHEN 'FAILED' THEN 'FAILED'
                WHEN 'DELETED_LDAP' THEN 'TO_BE_DELETED'
                WHEN 'DELETED_OX' THEN 'TO_BE_DELETED'
                WHEN 'DELETED' THEN 'TO_BE_DELETED'
         END )::email.email_address_status_enum AS status,
         s.created_at                           AS created_at,
         s.updated_at                           AS updated_atfrom src sjoin ins i
  ON i.address = s.address
  AND    i.spsh_person_id = s.person_id::text;
  COMMIT;