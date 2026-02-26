'use client'

import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/services/account-api'
import { UserTransaction, RefundRequest } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function TransactionsSection() {
  const [transactions, setTransactions] = useState<UserTransaction[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds'>('transactions')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'transactions') {
        const data = await accountAPI.getTransactions()
        setTransactions(data.transactions)
      } else {
        const data = await accountAPI.getRefunds()
        setRefunds(data.refunds)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your transaction and refund history</CardDescription>
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </Button>
          <Button
            variant={activeTab === 'refunds' ? 'default' : 'outline'}
            onClick={() => setActiveTab('refunds')}
          >
            Refunds
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'transactions' ? (
          <>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium capitalize">{transaction.transaction_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                      </p>
                      {transaction.description && (
                        <p className="text-sm mt-1">{transaction.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.transaction_type === 'refund' ? 'text-green-600' : 'text-foreground'}`}>
                        {transaction.transaction_type === 'refund' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        transaction.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                        transaction.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {refunds.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No refund requests yet</p>
            ) : (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <div key={refund.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Refund Request</p>
                        <p className="text-sm text-muted-foreground">{refund.reason}</p>
                        <p className="text-sm mt-1">Amount: ₹{refund.refund_amount.toFixed(2)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        refund.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                        refund.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        refund.status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {refund.status}
                      </span>
                    </div>
                    {refund.rejection_reason && (
                      <p className="text-sm text-destructive mt-2">Reason: {refund.rejection_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mt-4">{error}</div>}
      </CardContent>
    </Card>
  )
}
