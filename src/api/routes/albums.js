const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/albums', {});

mongoose.connection.on('connected', () => {
  console.log('MongoDB conectado');
});

mongoose.connection.on('error', (err) => {
  console.error('Erro na conexão com o MongoDB:', err);
});

const albumSchema = new mongoose.Schema({
  nome: String,
  artista: { type: String, index: { type: 'hashed' } },
  ano: String,
  generos: [String],
  faixas: [String],
  lancamento: { type: Date, default: Date.now }
});

const Album = mongoose.model('Album', albumSchema);

// Consultar todos os álbuns
router.get('/', async (req, res) => {
  try {
    const docs = await Album.find();
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar um álbum por ID
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await Album.findById(id);
    if (doc) {
      res.json(doc);
    } else {
      res.status(404).json({ error: 'Álbum não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar um álbum por nome
router.get('/buscaAlbum/:nome', async (req, res) => {
  try {
    const doc = await Album.find({ nome: req.params.nome });
    if (doc) {
      res.status(200).json(doc);
    } else {
      res.status(404).json({ error: 'Álbum não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar álbuns pelo nome do artista usando um índice
router.get('/buscaIndex/:artista', async (req, res) => {
  try {
    const docs = await Album.find({ artista: req.params.artista });
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inserir múltiplos álbuns
router.post('/', async (req, res) => {
  const albums = req.body.albums;
  try {
    await Album.insertMany(albums);
    //console.log('Álbuns inseridos com sucesso!');
    res.status(201).json({ message: 'Álbuns inseridos com sucesso' });
  } catch (err) {
    console.error('Erro ao inserir álbuns:', err.message);
    res.status(500).json({ error: 'Erro ao inserir álbuns' });
  }
});

// Atualizar um álbum
router.put('/atualizaAlbum/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, artista, ano, generos, faixas, lancamento } = req.body;

  try {
    const doc = await Album.findByIdAndUpdate(id, {
      nome, artista, ano, generos, faixas, lancamento
    }, { new: true });

    if (doc) {
      res.status(200).json(doc);
    } else {
      res.status(404).json({ error: 'Álbum não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar todos os álbuns
router.delete('/', async (req, res) => {
  try {
    const deleteResult = await Album.deleteMany({});
    res.status(200).json({ message: `${deleteResult.deletedCount} registros deletados com sucesso!` });
  } catch (error) {
    console.error('Erro ao excluir registros:', error.message);
    res.status(500).json({ error: 'Erro ao excluir registros' });
  }
});

module.exports = router;
