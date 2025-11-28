import express from 'express';
import * as vmController from '../controllers/vmController.js';

const router = express.Router();

router.get('/', vmController.listVMs);
router.post('/', vmController.createVM);
router.get('/:id', vmController.getVMDetails);
router.delete('/:id', vmController.deleteVM);
router.post('/:id/start', vmController.startVM);
router.post('/:id/stop', vmController.stopVM);
router.patch('/:id/resources', vmController.updateVMResources);

// Disk attachment
router.post('/:id/disks/attach', vmController.attachDisk);
router.post('/:id/disks/detach', vmController.detachDisk);

// ISO mounting
router.post('/:id/iso/mount', vmController.mountISO);
router.post('/:id/iso/unmount', vmController.unmountISO);

export default router;
