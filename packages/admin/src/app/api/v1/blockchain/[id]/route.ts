import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.blockchainTransaction.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, email: true } },
      },
    })

    if (!transaction) {
      return notFound('Transaction not found')
    }

    return success(transaction)
  } catch (error) {
    return serverError(error)
  }
}
