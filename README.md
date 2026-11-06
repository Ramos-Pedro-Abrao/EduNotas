# EduNotas

Site para consulta e gestão de notas dos alunos.

## Base de dados

Para uma instalação nova, cria a base de dados `edunotas` e executa
[`database/database.txt`](./database/database.txt) no MySQL.

Se já tens uma instalação anterior, aplica uma vez
[`database/migrations/2026-11-05-turma-dos-alunos.sql`](./database/migrations/2026-11-05-turma-dos-alunos.sql)
depois de criares as tabelas `turmas` e `alunos`. A migração acrescenta a relação
entre alunos e turmas; os alunos existentes ficam sem turma até serem atribuídos
pela administração.

## Iniciar o servidor

Configura as variáveis de ambiente indicadas em `backend/.env` e inicia a API:

```sh
cd backend
npm install
node app.js
```

O servidor Express disponibiliza também os ficheiros estáticos de `frontend/`.
O professor entra pela mesma página de login e é encaminhado para a sua área;
as disciplinas e os alunos apresentados são limitados às atribuições da sua
conta.
