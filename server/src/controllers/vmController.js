import qemuService from '../services/qemuService.js';

export async function listVMs(req, res, next) {
  try {
    const vms = await qemuService.listVMs();
    res.json({ vms });
  } catch (error) {
    next(error);
  }
}

export async function createVM(req, res, next) {
  try {
    const vm = await qemuService.createVM(req.body);
    res.status(201).json({ vm });
  } catch (error) {
    next(error);
  }
}

export async function getVMDetails(req, res, next) {
  try {
    const { id } = req.params;
    const vm = qemuService.getVMDetails(id);
    res.json({ vm });
  } catch (error) {
    next(error);
  }
}

export async function deleteVM(req, res, next) {
  try {
    const { id } = req.params;
    const result = await qemuService.deleteVM(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function startVM(req, res, next) {
  try {
    const { id } = req.params;
    const result = await qemuService.startVM(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function stopVM(req, res, next) {
  try {
    const { id } = req.params;
    const result = await qemuService.stopVM(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateVMResources(req, res, next) {
  try {
    const { id } = req.params;
    const vm = await qemuService.updateVMResources(id, req.body);
    res.json({ vm });
  } catch (error) {
    next(error);
  }
}

export async function attachDisk(req, res, next) {
  try {
    const { id } = req.params;
    const { diskPath } = req.body;
    const vm = await qemuService.attachDisk(id, diskPath);
    res.json({ vm });
  } catch (error) {
    next(error);
  }
}

export async function detachDisk(req, res, next) {
  try {
    const { id } = req.params;
    const { diskPath } = req.body;
    const vm = await qemuService.detachDisk(id, diskPath);
    res.json({ vm });
  } catch (error) {
    next(error);
  }
}

export async function mountISO(req, res, next) {
  try {
    const { id } = req.params;
    const { isoPath } = req.body;
    const vm = await qemuService.mountISO(id, isoPath);
    res.json({ vm });
  } catch (error) {
    next(error);
  }
}

export async function unmountISO(req, res, next) {
  try {
    const { id } = req.params;
    const vm = await qemuService.unmountISO(id);
    res.json({ vm });
  } catch (error) {
    next(error);
  }
}
