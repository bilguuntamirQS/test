import { Router } from 'express'
import { getToken, createInvoice, checkInvoice } from './qpay.controller.js'

const qpayRouter = Router()

qpayRouter.get('/token', getToken)
qpayRouter.post('/invoice', createInvoice)
qpayRouter.get('/:id', checkInvoice)

export default qpayRouter
