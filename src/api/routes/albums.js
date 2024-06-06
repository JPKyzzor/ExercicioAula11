const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/albums', {
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB conectado');
});

mongoose.connection.on('error', (err) => {
  console.error('Erro na conexão com o MongoDB:', err);
});

const albumSchema = new mongoose.Schema({
  nome: String,
  artista: String,
  ano: String,
  generos: [String],
  faixas: [String],
  lancamento: { type: Date, default: Date.now }
});

const Album = mongoose.model('Album', albumSchema);

router.get('/', async (req, res) => {
  try {
    const docs = await Album.find();
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.post('/', async (req, res) => {
  const albums = req.body.albums;
  try {
    await Album.insertMany(albums);
    console.log('Álbuns inseridos com sucesso!');
    res.status(201).json({ message: 'Álbuns inseridos com sucesso' });
  } catch (err) {
    console.error('Erro ao inserir álbuns:', err.message);
    res.status(500).json({ error: 'Erro ao inserir álbuns' });
  }
});


// Rota para deletar todos os registros presentes no banco de dados
router.delete('/', async (req, res) => {
  try {
    const deleteResult = await Album.deleteMany({});
    console.log(`${deleteResult.deletedCount} registros deletados com sucesso!`);
    res.status(200).json({ message: `${deleteResult.deletedCount} registros deletados com sucesso!` });
  } catch (error) {
    console.error('Erro ao excluir registros:', error.message);
    res.status(500).json({ error: 'Erro ao excluir registros' });
  }
});

module.exports = router;