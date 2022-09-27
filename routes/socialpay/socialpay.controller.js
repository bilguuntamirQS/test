import crypto from "crypto-js";
import axios from "axios";
import { sendPaid } from '../../server.js'
import { PrismaClient } from "@prisma/client";

const { HmacSHA256 } = crypto;

const prisma = new PrismaClient();

const bearerToken =
  "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJNRVJDSEFOVF9WVUxDQU5fQU5BTElUWUNTX0xMQyIsImlhdCI6MTY2MDMwMTQwMH0.5S_u88JkeJ5EGQafbN3-5CftMOUEerQ8OBRhGjnLo9E";
const hashKey = "O1Kn)Xxl%Nhvi8OT";

const header = {
  "Content-Type": "application/json",
  Authorization: bearerToken
};

export const createInvoice = async(req, res) => {
  if(req.body.amount == null) {
    return res.status(400).json('amount is null')
  }
  const invoice = await prisma.invoice.create({
    data: {
      amount: parseFloat(req.body.amount.toFixed(2)),
      phone: req.body.phone
    }
  });
  if (invoice) {
    try {
      const data = {
        amount: invoice.amount.toString(),
        callback: "http://vulcan.mn",
        transactionId: invoice.id.toString() + "asfd",
        genToken: "N",
        returnType: "POST"
      };
      const hash = HmacSHA256(
        data.transactionId + data.amount + data.returnType + data.callback,
        hashKey
      ).toString(crypto.enc.Hex);

      const request = await axios.post(
        "https://ecommerce.golomtbank.com/api/invoice",
        { ...data, checksum: hash },
        {
          headers: header
        }
      );

      if (
        request.data.checksum ===
        HmacSHA256(
          request.data.invoice + request.data.transactionId,
          hashKey
        ).toString(crypto.enc.Hex)
      ) {
        return res.status(200).json({
          ...request.data,
          redirect_url: `https://ecommerce.golomtbank.com/payment/mn/${request.data.invoice}`,
          id: invoice.id
        });
      } else {
        return res.status(400).json("error");
      }
    } catch (e) {
      console.log(e);
      return res.status(400).json("error");
    }
  } else {
    return res.status(400).json("error");
  }
}

export const checkInvoice = async (req, res) => {
  const { id } = req.params;
  const hash = HmacSHA256(id + id, hashKey).toString(crypto.enc.Hex);

  const {data} = await axios.post('https://ecommerce.golomtbank.com/api/inquiry', 
    {
      checksum: hash,
      transactionId: id
    }, {
      headers: header
    })

  if(data.errorDesc == 'Амжилттай') {
    await prisma.invoice.update({
      where: {
        id: parseInt(id)
      },
      data: {
        verified: true
      }
    })

    sendPaid(true)
  }

  return res.status(200).json(data);
}
