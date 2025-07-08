import { Router } from 'express'
import {
    getAllTenants,
    getTenantById,
    getTenantByName,
    createTenant,
    updateTenant,
    deleteTenant,
} from '../controllers/tenantController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

router.use(authMiddleware)

router.get('/', getAllTenants)
router.get('/:id', getTenantById)
router.get('/by-name/:name', getTenantByName) // Optional
router.post('/', createTenant)
router.put('/:id', updateTenant)
router.delete('/:id', deleteTenant)

export default router
