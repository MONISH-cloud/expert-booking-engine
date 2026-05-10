const express = require('express');
const { getExperts, getExpertById } = require('../controllers/expertController');

const router = express.Router();

router.get('/',    getExperts);
router.get('/:id', getExpertById);

module.exports = router;
