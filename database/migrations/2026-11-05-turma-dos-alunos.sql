USE edunotas;

ALTER TABLE alunos
    ADD COLUMN turma_id INT NULL,
    ADD INDEX idx_alunos_turma_id (turma_id),
    ADD CONSTRAINT fk_alunos_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id);
