import { Router } from 'express'
import  { createInvoice, checkInvoice } from './socialpay.controller.js'

const socialPayRouter = Router()

socialPayRouter.post('/invoice', createInvoice)
socialPayRouter.get('/invoice/:id', checkInvoice)

export default socialPayRouter
