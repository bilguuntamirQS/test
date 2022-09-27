import { PrismaClient } from '@prisma/client'
import { sendPaid } from '../../server.js'

const prisma = new PrismaClient()

export const getToken = async (req, res) => {
  try {
    const { data } = await axios.post('https://merchant.qpay.mn/v2/auth/token', {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic VEFQUEFZOlRVUjJoVDQ1',
        Host: 'merchant.qpay.mn',
        'User-Agent': 'insomnia/2022.2.1',
        Cookie: '_4d45d=http://10.233.105.45:3000',
        Accept: '*/*',
        'Content-Length': 0
      }
    })
    const token = await prisma.token.update({
      where: {
        id: 1
      },
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token
      }
    })
    res.status(200).json(token)
  } catch (error) {
    res.status(400).json(error)
  }
}

export const createInvoice = async (req, res) => {
  const invoice = await prisma.invoice.create({
    data: {
      amount: parseInt(req.body.amount)
    }
  })
  const token = await prisma.token.findUnique({
    where: { id: 1 }
  })
  if (!invoice) {
    res.status(400).json('hadgalj chadsangui')
  }
  const data = {
    invoice_code: 'TAPPAY_INVOICE',
    sender_invoice_no: invoice.id.toString(),
    invoice_receiver_code: 'terminal',
    invoice_description: 'hello',
    amount: req.body.amount,
    callback_url: 'http://vulcan.mn/qpay/' + invoice.id
  }
  const response = await axios.post('https://merchant.qpay.mn/v2/invoice', data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token.access_token,
      Host: 'merchant.qpay.mn',
      'User-Agent': 'insomnia/2021.2.2',
      Cookie: 'qpay_merchant_service.sid=s%3AFVUMTAKoN-wEhO9x5qM_3FRXTMgP41Q4.6kjdtk6%2FrN%2Bot6iQBuVOk6jG8KwyH3q2BhhFNBh1OkQ; _4d45d=http://10.233.76.223:3000'
    }
  })
  return res.status(200).json({
    invoice_id: invoice.id,
    ...response.data
  })
}

export const checkInvoice = async (req, res) => {
  const { id } = req.params
  const token = await prisma.token.findFirst()
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: parseInt(id)
    }
  })

  const data = {
    object_type: 'INVOICE',
    object_id: invoice.id.toString(),
    offset: {
      page_number: 1,
      page_limit: 100
    }
  }

  const response = await axios.post('https://merchant.qpay.mn/v2/payment/check', data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token.access_token,
      Host: 'merchant.qpay.mn',
      'User-Agent': 'insomnia/2021.2.2',
      Cookie: 'qpay_merchant_service.sid=s%3AFVUMTAKoN-wEhO9x5qM_3FRXTMgP41Q4.6kjdtk6%2FrN%2Bot6iQBuVOk6jG8KwyH3q2BhhFNBh1OkQ; _4d45d=http://10.233.76.223:3000'
    }
  }).then(res => res.data).catch(err => console.log(err))

  if (response.paid_amount) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        verified: true
      }
    })

    sendPaid(true)
  }

  return res.status(200).json(response)
}

