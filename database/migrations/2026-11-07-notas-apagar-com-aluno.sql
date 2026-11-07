USE edunotas;

ALTER TABLE notas
    DROP FOREIGN KEY notas_ibfk_1;

ALTER TABLE notas
    ADD CONSTRAINT fk_notas_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        ON DELETE CASCADE;
