import diskService from '../services/diskService.js';

export async function listDisks(req, res, next) {
  try {
    const disks = await diskService.listDisks();
    res.json({ disks });
  } catch (error) {
    next(error);
  }
}

export async function createDisk(req, res, next) {
  try {
    const disk = await diskService.createDisk(req.body);
    res.status(201).json({ disk });
  } catch (error) {
    next(error);
  }
}

export async function getDiskInfo(req, res, next) {
  try {
    const { id } = req.params;
    const disk = await diskService.getDiskInfo(id);
    res.json({ disk });
  } catch (error) {
    next(error);
  }
}

export async function deleteDisk(req, res, next) {
  try {
    const { id } = req.params;
    const result = await diskService.deleteDisk(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function uploadDisk(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const disk = await diskService.uploadDisk(req.file.originalname, req.file.path);
    res.status(201).json({ disk });
  } catch (error) {
    next(error);
  }
}
