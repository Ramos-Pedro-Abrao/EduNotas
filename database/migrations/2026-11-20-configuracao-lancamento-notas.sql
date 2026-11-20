USE edunotas;

CREATE TABLE IF NOT EXISTS configuracao_notas (
    id TINYINT UNSIGNED PRIMARY KEY,
    modo ENUM('fechado', 'todos', 'professor') NOT NULL DEFAULT 'fechado',
    professor_id INT NULL,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
);

INSERT IGNORE INTO configuracao_notas (id, modo) VALUES (1, 'fechado');