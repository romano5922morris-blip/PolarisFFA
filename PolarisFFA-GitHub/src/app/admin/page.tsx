'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice, formatDateTime, getRoleHierarchy, canManageRole } from '@/lib/utils'
import { Users, ShoppingCart, DollarSign, Shield, Crown, Search, Loader2, Plus, Edit, Trash2, MoreHorizontal, Eye, ShieldCheck, MessageSquare } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function getRoleBadgeVariant(role: string): "role-user" | "role-helper" | "role-admin" | "role-head_admin" | "role-co_owner" | "role-owner" {
  const roleLower = role.toLowerCase().replace('_', '_')
  return `role-${roleLower}` as "role-user" | "role-helper" | "role-admin" | "role-head_admin" | "role-co_owner" | "role-owner"
}

const roles = ['USER', 'HELPER', 'ADMIN', 'HEAD_ADMIN', 'CO_OWNER', 'OWNER'] as const

interface AdminStats {
  totalUsers: number
  onlineStatus: boolean
  currentPlayers: number
  totalOrders: number
  totalRevenue: number
  openTickets: number
}

interface AdminUser {
  id: string
  email: string
  minecraftUsername: string
  role: string
  emailVerified: boolean
  createdAt: string
  _count: { orders: number; purchases: number }
}

interface AdminProduct {
  id: string
  name: string
  description: string
  price: number
  type: string
  active: boolean
  featured: boolean
  sortOrder: number
  createdAt: string
}

interface AdminOrder {
  id: string
  userId: string
  status: string
  total: number
  createdAt: string
  user: { minecraftUsername: string; email: string }
  items: Array<{ product: { name: string }; price: number; quantity: number }>
}

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  price: z.number().min(1),
  type: z.string().min(1),
  active: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().default(0),
})

type ProductForm = z.infer<typeof productSchema>

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'orders' | 'staff'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { active: true, featured: false, sortOrder: 0 },
  })

  useEffect(() => {
    if (session?.user?.role && !['ADMIN', 'HEAD_ADMIN', 'CO_OWNER', 'OWNER'].includes(session.user.role)) {
      router.push('/')
    }
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, productsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/products'),
        fetch('/api/admin/orders'),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (ordersRes.ok) setOrders(await ordersRes.json())
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.minecraftUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onSubmitProduct = async (data: ProductForm) => {
    setCreatingProduct(true)
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        toast({ variant: 'destructive', title: 'Failed', description: result.error })
        return
      }

      toast({ title: editingProduct ? 'Product Updated' : 'Product Created' })
      reset()
      setEditingProduct(null)
      fetchData()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed', description: 'An unexpected error occurred.' })
    } finally {
      setCreatingProduct(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Product Deleted' })
      fetchData()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete product' })
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    // Implementation would go here
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    // Implementation would go here
  }

  if (!session || !['ADMIN', 'HEAD_ADMIN', 'CO_OWNER', 'OWNER'].includes(session.user.role)) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <Card className="w-full max-w-md bg-polaris-950/50 border-polaris-800">
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-polaris-400">You do not have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-polaris-400">Manage your PolarisFFA server</p>
            </div>
            <Badge variant={getRoleBadgeVariant(session.user.role)} className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {session.user.role}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-polaris-950/50 border-polaris-800">
                  <CardContent className="p-6 h-24 bg-polaris-800/50" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-polaris-800/50"><Users className="h-6 w-6 text-polaris-400" /></div>
                        <div>
                          <p className="text-xs text-polaris-500 uppercase tracking-wider">Total Users</p>
                          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-polaris-800/50"><Shield className="h-6 w-6 text-green-400" /></div>
                        <div>
                          <p className="text-xs text-polaris-500 uppercase tracking-wider">Server Status</p>
                          <p className="text-3xl font-bold text-white">{stats.onlineStatus ? 'Online' : 'Offline'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-polaris-800/50"><Users className="h-6 w-6 text-polaris-400" /></div>
                        <div>
                          <p className="text-xs text-polaris-500 uppercase tracking-wider">Players Online</p>
                          <p className="text-3xl font-bold text-white">{stats.currentPlayers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-polaris-800/50"><ShoppingCart className="h-6 w-6 text-polaris-400" /></div>
                        <div>
                          <p className="text-xs text-polaris-500 uppercase tracking-wider">Total Orders</p>
                          <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-polaris-800/50"><DollarSign className="h-6 w-6 text-green-400" /></div>
                        <div>
                          <p className="text-xs text-polaris-500 uppercase tracking-wider">Revenue</p>
                          <p className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-polaris-800/50"><MessageSquare className="h-6 w-6 text-polaris-400" /></div>
                        <div>
                          <p className="text-xs text-polaris-500 uppercase tracking-wider">Open Tickets</p>
                          <p className="text-3xl font-bold text-white">{stats.openTickets}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'overview' | 'users' | 'products' | 'orders' | 'staff')} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="staff">Staff</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Link href="/store"><Button className="w-full h-20 flex-col gap-2"><Plus className="h-6 w-6" />Add Product</Button></Link>
                      <Link href="/tickets"><Button variant="outline" className="w-full h-20 flex-col gap-2"><MessageSquare className="h-6 w-6" />View Tickets</Button></Link>
                      <Button variant="outline" className="w-full h-20 flex-col gap-2"><Users className="h-6 w-6" />Manage Users</Button>
                      <Button variant="outline" className="w-full h-20 flex-col gap-2"><Shield className="h-6 w-6" />Server Console</Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users">
                  <div className="flex justify-between mb-4">
                    <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-polaris-400 text-sm border-b border-polaris-800">
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 font-medium">Role</th>
                          <th className="pb-3 font-medium">Verified</th>
                          <th className="pb-3 font-medium">Orders</th>
                          <th className="pb-3 font-medium">Purchases</th>
                          <th className="pb-3 font-medium">Joined</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-polaris-800">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-polaris-900/50">
                            <td className="py-4">
                              <div className="font-medium text-white">{user.minecraftUsername}</div>
                              <div className="text-sm text-polaris-400">{user.email}</div>
                            </td>
                            <td className="py-4">
                              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </td>
                            <td className="py-4">
                              <Badge variant={user.emailVerified ? 'success' : 'destructive'}>{user.emailVerified ? 'Yes' : 'No'}</Badge>
                            </td>
                            <td className="py-4 text-polaris-300">{user._count.orders}</td>
                            <td className="py-4 text-polaris-300">{user._count.purchases}</td>
                            <td className="py-4 text-polaris-400 text-sm">{formatDateTime(user.createdAt)}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <select
                                  value={user.role}
                                  onChange={(e) => changeUserRole(user.id, e.target.value)}
                                  disabled={getRoleHierarchy(session.user.role) <= getRoleHierarchy(user.role)}
                                  className="bg-polaris-900 border-polaris-700 text-white text-sm rounded px-2 py-1"
                                >
                                  {roles
                                    .filter((r) => canManageRole(session.user.role, r))
                                    .map((r) => (
                                      <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="products">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Products ({products.length})</h3>
                    <Button onClick={() => { setEditingProduct(null); reset(); }} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-polaris-400 text-sm border-b border-polaris-800">
                          <th className="pb-3 font-medium">Product</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Price</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Featured</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-polaris-800">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-polaris-900/50">
                            <td className="py-4">
                              <div className="font-medium text-white">{product.name}</div>
                              <div className="text-sm text-polaris-400 truncate max-w-xs">{product.description}</div>
                            </td>
                            <td className="py-4"><Badge variant="outline">{product.type}</Badge></td>
                            <td className="py-4 text-white font-medium">{formatPrice(product.price)}</td>
                            <td className="py-4"><Badge variant={product.active ? 'success' : 'destructive'}>{product.active ? 'Active' : 'Inactive'}</Badge></td>
                            <td className="py-4"><Badge variant={product.featured ? 'premium' : 'outline'}>{product.featured ? 'Yes' : 'No'}</Badge></td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setValue('name', product.name); setValue('description', product.description); setValue('price', product.price); setValue('type', product.type); setValue('active', product.active); setValue('featured', product.featured); setValue('sortOrder', product.sortOrder); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)}>
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(editingProduct || creatingProduct) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-polaris-950 border-polaris-800">
                        <CardHeader>
                          <CardTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleSubmit(onSubmitProduct)} className="space-y-4">
                            <div className="space-y-1.5"><Label>Name</Label><Input {...register('name')} />{errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}</div>
                            <div className="space-y-1.5"><Label>Description</Label><textarea {...register('description')} className="w-full min-h-[100px] rounded-lg border border-polaris-700 bg-polaris-950/50 px-3 py-2 text-white" />{errors.description && <p className="text-red-400 text-sm">{errors.description.message}</p>}</div>
                            <div className="space-y-1.5"><Label>Price (cents)</Label><Input type="number" {...register('price', { valueAsNumber: true })} />{errors.price && <p className="text-red-400 text-sm">{errors.price.message}</p>}</div>
                            <div className="space-y-1.5"><Label>Type</Label><Input {...register('type')} />{errors.type && <p className="text-red-400 text-sm">{errors.type.message}</p>}</div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2"><input type="checkbox" {...register('active')} /> Active</label>
                              <label className="flex items-center gap-2"><input type="checkbox" {...register('featured')} /> Featured</label>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1" loading={creatingProduct}>{editingProduct ? 'Update' : 'Create'}</Button>
                              <Button type="button" variant="outline" onClick={() => { setEditingProduct(null); reset(); }}>Cancel</Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orders">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-polaris-400 text-sm border-b border-polaris-800">
                          <th className="pb-3 font-medium">Order</th>
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 font-medium">Items</th>
                          <th className="pb-3 font-medium">Total</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-polaris-800">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-polaris-900/50">
                            <td className="py-4 font-mono text-sm text-polaris-400">#{order.id.slice(0, 8)}</td>
                            <td className="py-4">
                              <div className="font-medium text-white">{order.user.minecraftUsername}</div>
                              <div className="text-sm text-polaris-400">{order.user.email}</div>
                            </td>
                            <td className="py-4 text-polaris-300">{order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')}</td>
                            <td className="py-4 text-white font-medium">{formatPrice(order.total)}</td>
                            <td className="py-4"><Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING' ? 'outline' : 'destructive'}>{order.status}</Badge></td>
                            <td className="py-4 text-polaris-400 text-sm">{formatDateTime(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="staff">
                  <Card className="bg-polaris-950/50 border-polaris-800">
                    <CardHeader>
                      <CardTitle>Staff Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-polaris-400 mb-6">Staff management features coming soon. Use the Users tab to manage roles.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {roles.map((role) => (
                          <div key={role} className="p-4 rounded-lg bg-polaris-900/50 border border-polaris-800 text-center">
                            <Badge variant={getRoleBadgeVariant(role)} className="text-lg mb-2">{role}</Badge>
                            <p className="text-polaris-400 text-sm">Hierarchy Level: {getRoleHierarchy(role)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  )
}