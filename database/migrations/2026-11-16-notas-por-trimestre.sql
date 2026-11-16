USE edunotas;

ALTER TABLE notas
    ADD COLUMN trimestre TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER lecao_id,
    ADD COLUMN prova_final DECIMAL(5, 2) NULL AFTER prova_trimestral;

SET @indice_notas_anterior = (
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notas'
      AND NON_UNIQUE = 0
      AND INDEX_NAME <> 'PRIMARY'
    GROUP BY INDEX_NAME
    HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') = 'aluno_id,lecao_id'
    LIMIT 1
);

SET @ddl_notas_trimestre = IF(
    @indice_notas_anterior IS NULL,
    'ALTER TABLE notas ADD UNIQUE KEY uq_notas_aluno_lecao_trimestre (aluno_id, lecao_id, trimestre)',
    CONCAT(
        'ALTER TABLE notas DROP INDEX `', @indice_notas_anterior,
        '`, ADD UNIQUE KEY uq_notas_aluno_lecao_trimestre (aluno_id, lecao_id, trimestre)'
    )
);

PREPARE migracao_notas_trimestre FROM @ddl_notas_trimestre;
EXECUTE migracao_notas_trimestre;
DEALLOCATE PREPARE migracao_notas_trimestre;