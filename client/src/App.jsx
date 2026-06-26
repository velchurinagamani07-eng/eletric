import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import WebNavbar from './components/Navbar/WebNavbar'
import MobileNavbar from './components/Navbar/MobileNavbar'
import Footer from './components/Layout/Footer'
import FloatingButtons from './components/FloatingButtons'
import PrivateRoute from './components/Routes/PrivateRoute'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import ElectricLoader from './components/ElectricLoader'
import AnnouncementBar from './components/AnnouncementBar'
import EntrySplash from './components/EntrySplash'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Services = lazy(() => import('./pages/Services'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const Booking = lazy(() => import('./pages/Booking'))
const Cart = lazy(() => import('./pages/Cart'))
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'))
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const WorkerLogin = lazy(() => import('./pages/WorkerLogin'))
const AccountSuspended = lazy(() => import('./pages/AccountSuspended'))
const NotFound = lazy(() => import('./pages/NotFound'))
const StaticPage = lazy(() => import('./pages/StaticPage'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ManageBookings = lazy(() => import('./admin/ManageBookings'))
const ManagePayments = lazy(() => import('./admin/ManagePayments'))
const ManageEnquiries = lazy(() => import('./admin/ManageEnquiries'))
const ManageWorkers = lazy(() => import('./admin/ManageWorkers'))
const ManageServices = lazy(() => import('./admin/ManageServices'))
const ManageCoupons = lazy(() => import('./admin/ManageCoupons'))
const ManageBanners = lazy(() => import('./admin/ManageBanners'))
const ManageProducts = lazy(() => import('./admin/ManageProducts'))
const IncomeGraphs = lazy(() => import('./admin/IncomeGraphs'))
const WorkerGraphs = lazy(() => import('./admin/WorkerGraphs'))
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const WorkerLayout = lazy(() => import('./worker/WorkerLayout'))
const WorkerHistory = lazy(() => import('./worker/WorkerHistory'))
const WorkerNotifications = lazy(() => import('./worker/WorkerNotifications'))
const WorkerProfile = lazy(() => import('./worker/WorkerProfile'))

export default function App() {
  const { pathname } = useLocation()
  const initAuthListener = useAuthStore((state) => state.initAuthListener)
  const user = useAuthStore((state) => state.user)
  const authReady = useAuthStore((state) => state.authReady)
  const syncCartForUser = useCartStore((state) => state.syncForUser)
  const isAdminOrWorker = ['/admin', '/worker'].some((path) => pathname.startsWith(path))
  const showPublicChrome = !isAdminOrWorker
  const showAnnouncement = showPublicChrome

  useEffect(() => initAuthListener(), [initAuthListener])
  useEffect(() => {
    if (!authReady) return
    syncCartForUser(user)
  }, [authReady, syncCartForUser, user])

  return (
    <ErrorBoundary resetKey={pathname}>
      <div
        className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-gray-100 transition-colors"
        style={{ '--announcement-offset': showAnnouncement ? '40px' : '0px' }}
      >
        {showPublicChrome && <EntrySplash />}
        {showPublicChrome && <AnnouncementBar visible={showAnnouncement} />}
        {showPublicChrome && <WebNavbar />}
        {showPublicChrome && <MobileNavbar />}
        <div className={showPublicChrome ? `${showAnnouncement ? 'pt-8 lg:pt-[100px]' : 'pt-0 lg:pt-16'} pb-24 transition-[padding] duration-300 lg:pb-0` : ''}>
          <Suspense fallback={<ElectricLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/checkout" element={<Booking />} />
              <Route path="/book/:serviceSlug" element={<Booking />} />
              <Route path="/receipt/:bookingId" element={<ReceiptPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<StaticPage type="faq" />} />
              <Route path="/blog" element={<StaticPage type="blog" />} />
              <Route path="/privacy-policy" element={<StaticPage type="privacy" />} />
              <Route path="/terms" element={<StaticPage type="terms" />} />
              <Route path="/payment-success" element={<StaticPage type="success" />} />
              <Route path="/payment-failed" element={<StaticPage type="failed" />} />

              <Route
                path="/admin/*"
                element={
                  <PrivateRoute roles={['admin', 'superadmin']}>
                    <AdminLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bookings" element={<ManageBookings />} />
                <Route path="payments" element={<ManagePayments />} />
                <Route path="enquiries" element={<ManageEnquiries />} />
                <Route path="workers" element={<ManageWorkers />} />
                <Route path="services" element={<ManageServices />} />
                <Route path="coupons" element={<ManageCoupons />} />
                <Route path="products" element={<ManageProducts />} />
                <Route path="splash" element={<ManageBanners initialSection="splash" />} />
                <Route path="income" element={<IncomeGraphs />} />
                <Route path="worker-graphs" element={<WorkerGraphs />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="settings/hero" element={<AdminSettings initialSection="hero" />} />
                <Route path="settings/promo" element={<AdminSettings initialSection="promo" />} />
                <Route path="settings/tools" element={<AdminSettings initialSection="tools" />} />
              </Route>

              <Route
                path="/worker/*"
                element={
                  <PrivateRoute roles={['worker', 'admin']}>
                    <WorkerLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<WorkerDashboard />} />
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="jobs" element={<WorkerDashboard />} />
                <Route path="history" element={<WorkerHistory />} />
                <Route path="notifications" element={<WorkerNotifications />} />
                <Route path="profile" element={<WorkerProfile />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/worker/login" element={<WorkerLogin />} />
              <Route path="/account-suspended" element={<AccountSuspended />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          {showPublicChrome && <Footer />}
        </div>
        {showPublicChrome && <FloatingButtons />}
      </div>
    </ErrorBoundary>
  )
}
