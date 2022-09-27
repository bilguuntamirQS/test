import express from 'express'
import axios from 'axios'
import qpayRouter from './routes/qpay/qpay.router.js'
import socialPayRouter from './routes/socialpay/socialpay.router.js'

const app = express()

app.use(express.json())

app.use('/qpay', qpayRouter)
app.use('/socialpay', socialPayRouter)

export default app
