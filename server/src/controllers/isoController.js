import isoService from '../services/isoService.js';

export async function listISOs(req, res, next) {
  try {
    const isos = await isoService.listISOs();
    res.json({ isos });
  } catch (error) {
    next(error);
  }
}

export async function uploadISO(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const iso = await isoService.uploadISO(req.file);
    res.status(201).json({ iso });
  } catch (error) {
    next(error);
  }
}

export async function getISO(req, res, next) {
  try {
    const { id } = req.params;
    const iso = await isoService.getISO(id);
    res.json({ iso });
  } catch (error) {
    next(error);
  }
}

export async function deleteISO(req, res, next) {
  try {
    const { id } = req.params;
    const result = await isoService.deleteISO(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
