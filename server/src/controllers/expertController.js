const Expert = require('../models/Expert');

// GET /api/experts?search=&category=&page=&limit=
const getExperts = async (req, res, next) => {
  try {
    const { search = '', category, page = 1, limit = 9 } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { bio: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Expert.countDocuments(query);
    const experts = await Expert.find(query)
      .select('-availableSlots')
      .sort({ rating: -1, experience: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      status: 'success',
      data: {
        experts,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/experts/:id
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id).lean();
    if (!expert) {
      return res.status(404).json({ status: 'error', message: 'Expert not found', errors: [] });
    }

    // Sort slots chronologically
    expert.availableSlots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    res.json({ status: 'success', data: expert });
  } catch (err) {
    next(err);
  }
};

module.exports = { getExperts, getExpertById };
