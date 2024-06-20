const express = require('express');
const router = express.Router();
const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1'
});

const keyspace = 'music';

const createKeyspace = async () => {
  const query = `
    CREATE KEYSPACE IF NOT EXISTS ${keyspace} 
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}
  `;
  try {
    await client.execute(query);
  } catch (error) {
    console.error('Erro ao criar o keyspace:', error);
  }
};

const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ${keyspace}.albums (
      id UUID PRIMARY KEY,
      nome TEXT,
      artista TEXT,
      ano TEXT,
      generos LIST<TEXT>,
      faixas LIST<TEXT>,
      lancamento TIMESTAMP
    )
  `;
  try {
    await client.execute(query);
  } catch (error) {
    console.error('Erro ao criar a tabela de álbuns:', error);
  }
};

const createIndex = async () => {
  const query = `
    CREATE INDEX IF NOT EXISTS ON ${keyspace}.albums (artista)
  `;
  try {
    await client.execute(query);
  } catch (error) {
    console.error('Erro ao criar o índice para artista:', error);
  }
};

(async () => {
  try {
    await client.connect();
    console.log('Conexão com Cassandra foi bem sucedida!');
    await createKeyspace();
    await createTable();
    await createIndex();
  } catch (error) {
    console.error('Erro ao inicializar Cassandra:', error);
  }
})();

// Consultar todos os álbuns
router.get('/', async (req, res) => {
  const query = `SELECT * FROM ${keyspace}.albums`;
  try {
    const result = await client.execute(query, [], { fetchSize: 20000 });
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consultar um álbum por ID
router.get('/:id', async (req, res) => {
  const query = `SELECT * FROM ${keyspace}.albums WHERE id = ?`;
  const params = [cassandra.types.Uuid.fromString(req.params.id)];
  try {
    const result = await client.execute(query, params, { prepare: true });
    if (result.rowLength > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Álbum não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consultar um álbum por nome
router.get('/buscaAlbum/:nome', async (req, res) => {
  const query = `SELECT * FROM ${keyspace}.albums WHERE nome = ? ALLOW FILTERING`;
  const params = [req.params.nome];
  try {
    const result = await client.execute(query, params, { prepare: true });
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consultar álbuns pelo nome do artista usando um índice
router.get('/buscaIndex/:artista', async (req, res) => {
  const query = `SELECT * FROM ${keyspace}.albums WHERE artista = ? ALLOW FILTERING`;
  const params = [req.params.artista];
  try {
    const result = await client.execute(query, params, { prepare: true });
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inserir múltiplos álbuns
router.post('/', async (req, res) => {
  const albums = req.body.albums;
  const queries = albums.map(album => ({
    query: `INSERT INTO ${keyspace}.albums (id, nome, artista, ano, generos, faixas, lancamento) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [
      cassandra.types.Uuid.random(),
      album.nome,
      album.artista,
      album.ano,
      album.generos,
      album.faixas,
      album.lancamento
    ]
  }));
  try {
    await client.batch(queries, { prepare: true });
    res.status(201).json({ message: 'Álbuns inseridos com sucesso' });
  } catch (error) {
    console.error('Erro ao inserir álbuns:', error.message);
    res.status(500).json({ error: 'Erro ao inserir álbuns' });
  }
});

// Atualizar um álbum
router.put('/atualizaAlbum/:id', async (req, res) => {
  const { id } = req.params;
  const {nome, artista, ano, generos, faixas} = req.body;

  const query = `
    UPDATE ${keyspace}.albums 
    SET nome = ?, artista = ?, ano = ?, generos = ?, faixas = ?
    WHERE id = ?
  `;
  const params = [nome, artista, ano, generos, faixas, id];

  try {
    await client.execute(query, params, { prepare: true });
    res.status(200).json({ message: 'Álbum atualizado com sucesso' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar todos os álbuns
const truncateTable = async () => {
  try {
    const query = `TRUNCATE ${keyspace}.albums`;
    await client.execute(query);
  } catch (error) {
    console.error('Erro ao limpar a tabela de álbuns:', error);
    throw error;
  }
};

// Endpoint DELETE para limpar a tabela de álbuns
router.delete('/', async (req, res) => {
  try {
    await truncateTable();
    res.status(200).json({ message: 'Tabela de álbuns limpa com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar a tabela de álbuns' });
  }
});

module.exports = router;
