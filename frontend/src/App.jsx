import { lazy, Suspense } from 'react'
import { useAuth } from '@clerk/react'
import PageLoader from "./components/PageLoader"
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import { Route, Routes } from 'react-router'

import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import ProductPage from './pages/ProductPage'
import CheckoutReturnPage from './pages/CheckoutReturnPage'
import OrdersPage from './pages/OrdersPage'
import NotFoundPage from './pages/NotFoundPage'

// Pull in the Stream Chat/Video SDKs, and the admin dashboard, only when
// someone actually opens an order/call/admin page instead of bloating the
// main bundle for every visitor.
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const OrderCallPage = lazy(() => import('./pages/OrderCallPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AdminOverviewPage = lazy(() => import('./pages/AdminOverviewPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'))
const AdminCustomersPage = lazy(() => import('./pages/AdminCustomersPage'))
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'))
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'))

function App() {
  const {isLoaded}=useAuth()

  if(!isLoaded) return <PageLoader/>

  return (
    <Layout>
     <Suspense fallback={<PageLoader/>}>
      <Routes>
       <Route path='/' element={<HomePage/>}/>
       <Route path='/cart' element={<CartPage/>}/>
       <Route path='/checkout' element={<CheckoutPage/>}/>
       <Route path='/product/:slug' element={<ProductPage/>}/>
       <Route path='/checkout/return' element={<CheckoutReturnPage/>}/>
       <Route path='/orders' element={<OrdersPage/>}/>
       <Route path='/orders/:id' element={<OrderDetailPage/>}/>
       <Route path='/orders/:id/call' element={<OrderCallPage/>}/>
       <Route path='/admin' element={<AdminLayout/>}>
         <Route index element={<AdminOverviewPage/>}/>
         <Route path='orders' element={<AdminOrdersPage/>}/>
         <Route path='customers' element={<AdminCustomersPage/>}/>
         <Route path='categories' element={<AdminCategoriesPage/>}/>
         <Route path='products' element={<AdminProductsPage/>}/>
       </Route>
       <Route path='*' element={<NotFoundPage/>}/>
      </Routes>
     </Suspense>
    </Layout>
  )
}

export default App
