const express = require('express')
const router = express.Router()
const albums = require('./albums')

router.use(express.json())
router.use('/albums', albums)

module.exports = router