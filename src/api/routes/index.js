const express = require('express');
const router = express.Router();
const albums = require('./albums');
const albumsCassandra = require('./albumsCassandra'); // Nova rota

router.use(express.json());
router.use('/albums', albums);
router.use('/albumsCassandra', albumsCassandra); // Nova rota

module.exports = router;
